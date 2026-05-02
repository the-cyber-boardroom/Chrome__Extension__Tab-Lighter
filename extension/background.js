const DEFAULT_SETTINGS = Object.freeze({
  autoSuspendEnabled: true,
  inactiveMinutes: 45,
  protectPinned: true,
  protectAudible: true,
  protectActive: true,
  protectDiscarded: true,
  protectForms: false,
  allowlist: [
    'mail.google.com',
    'docs.google.com',
    'localhost',
    '127.0.0.1'
  ],
  memoryWarningPercent: 80,
  autoSuspendOnHighMemory: false,
  highMemoryMinutes: 15
});

const STORAGE_KEYS = Object.freeze({
  settings: 'settings',
  tabActivity: 'tabActivity',
  lastAutoRun: 'lastAutoRun',
  eventLog: 'eventLog'
});

const ALARM_NAME = 'tab-lighter-auto-suspend';
const ALARM_PERIOD_MINUTES = 1;

chrome.runtime.onInstalled.addListener(async () => {
  await initializeSettings();
  await refreshAllKnownTabs();
  await ensureAlarm();
});

chrome.runtime.onStartup.addListener(async () => {
  await initializeSettings();
  await refreshAllKnownTabs();
  await ensureAlarm();
});

chrome.alarms.onAlarm.addListener(async alarm => {
  if (alarm.name === ALARM_NAME) {
    await runAutoSuspend('alarm');
  }
});

chrome.tabs.onActivated.addListener(async activeInfo => {
  await markTabActive(activeInfo.tabId, { activatedAt: Date.now() });
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const patch = { updatedAt: Date.now() };
  if (changeInfo.title || tab.title) patch.title = tab.title || changeInfo.title;
  if (changeInfo.url || tab.url) patch.url = tab.url || changeInfo.url;
  if (tab.active) patch.activatedAt = Date.now();
  await updateTabActivity(tabId, patch);
});

chrome.tabs.onRemoved.addListener(async tabId => {
  const tabActivity = await getTabActivity();
  delete tabActivity[String(tabId)];
  await chrome.storage.local.set({ [STORAGE_KEYS.tabActivity]: tabActivity });
});

chrome.windows.onFocusChanged.addListener(async windowId => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  const [activeTab] = await chrome.tabs.query({ active: true, windowId });
  if (activeTab?.id) await markTabActive(activeTab.id, { windowFocusedAt: Date.now() });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
  return true;
});

async function handleMessage(message) {
  switch (message?.type) {
    case 'GET_DASHBOARD_DATA':
      return { ok: true, data: await getDashboardData() };
    case 'SUSPEND_TAB':
      return { ok: true, data: await suspendTab(message.tabId, 'manual') };
    case 'RESTORE_TAB':
      return { ok: true, data: await restoreTab(message.tabId) };
    case 'SUSPEND_ALL_ELIGIBLE':
      return { ok: true, data: await suspendAllEligible(message.scope || 'all') };
    case 'SUSPEND_WINDOW_ELIGIBLE':
      return { ok: true, data: await suspendWindowEligible(message.windowId) };
    case 'RUN_AUTO_SUSPEND_NOW':
      return { ok: true, data: await runAutoSuspend('manual') };
    case 'GET_SETTINGS':
      return { ok: true, data: await getSettings() };
    case 'SAVE_SETTINGS':
      return { ok: true, data: await saveSettings(message.settings || {}) };
    case 'ADD_ALLOWLIST_DOMAIN':
      return { ok: true, data: await addAllowlistDomain(message.domain) };
    case 'GET_EVENT_LOG':
      return { ok: true, data: await getEventLog(message.limit || 100) };
    case 'LOG_EVENT':
      return { ok: true, data: await logEvent(message.eventType || 'UI_EVENT', message.payload || {}) };
    default:
      throw new Error(`Unknown message type: ${message?.type}`);
  }
}

async function ensureAlarm() {
  await chrome.alarms.create(ALARM_NAME, { periodInMinutes: ALARM_PERIOD_MINUTES });
}

async function initializeSettings() {
  const { settings } = await chrome.storage.local.get(STORAGE_KEYS.settings);
  if (!settings) {
    await chrome.storage.local.set({ [STORAGE_KEYS.settings]: { ...DEFAULT_SETTINGS } });
  }
}

async function getSettings() {
  const { settings } = await chrome.storage.local.get(STORAGE_KEYS.settings);
  return { ...DEFAULT_SETTINGS, ...(settings || {}) };
}

async function saveSettings(partialSettings) {
  const existing = await getSettings();
  const normalized = normalizeSettings({ ...existing, ...partialSettings });
  await chrome.storage.local.set({ [STORAGE_KEYS.settings]: normalized });
  return normalized;
}

function normalizeSettings(settings) {
  const inactiveMinutes = Number(settings.inactiveMinutes);
  const memoryWarningPercent = Number(settings.memoryWarningPercent);
  const highMemoryMinutes = Number(settings.highMemoryMinutes);
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    inactiveMinutes: Number.isFinite(inactiveMinutes) ? clamp(inactiveMinutes, 1, 10080) : DEFAULT_SETTINGS.inactiveMinutes,
    memoryWarningPercent: Number.isFinite(memoryWarningPercent) ? clamp(memoryWarningPercent, 1, 99) : DEFAULT_SETTINGS.memoryWarningPercent,
    highMemoryMinutes: Number.isFinite(highMemoryMinutes) ? clamp(highMemoryMinutes, 1, 10080) : DEFAULT_SETTINGS.highMemoryMinutes,
    allowlist: normalizeAllowlist(settings.allowlist)
  };
}

function normalizeAllowlist(value) {
  if (Array.isArray(value)) return value.map(String).map(v => v.trim()).filter(Boolean);
  if (typeof value === 'string') return value.split('\n').map(v => v.trim()).filter(Boolean);
  return [...DEFAULT_SETTINGS.allowlist];
}

async function addAllowlistDomain(domain) {
  const clean = String(domain || '').trim().toLowerCase();
  if (!clean) throw new Error('Domain cannot be empty.');
  const settings = await getSettings();
  const allowlist = [...new Set([...settings.allowlist, clean])];
  return saveSettings({ allowlist });
}


async function getEventLog(limit = 100) {
  const { eventLog } = await chrome.storage.local.get(STORAGE_KEYS.eventLog);
  const rows = Array.isArray(eventLog) ? eventLog : [];
  return rows.slice(0, Math.max(1, Math.min(500, Number(limit) || 100)));
}

async function logEvent(type, payload = {}) {
  const { eventLog } = await chrome.storage.local.get(STORAGE_KEYS.eventLog);
  const rows = Array.isArray(eventLog) ? eventLog : [];
  const next = [{ type: String(type || 'EVENT'), at: Date.now(), payload }, ...rows].slice(0, 500);
  await chrome.storage.local.set({ [STORAGE_KEYS.eventLog]: next });
  return next[0];
}

async function getTabActivity() {
  const { tabActivity } = await chrome.storage.local.get(STORAGE_KEYS.tabActivity);
  return tabActivity || {};
}

async function updateTabActivity(tabId, patch) {
  if (!tabId) return;
  const tabActivity = await getTabActivity();
  const key = String(tabId);
  tabActivity[key] = {
    ...(tabActivity[key] || {}),
    lastSeenAt: Date.now(),
    ...patch
  };
  await chrome.storage.local.set({ [STORAGE_KEYS.tabActivity]: tabActivity });
}

async function markTabActive(tabId, patch = {}) {
  await updateTabActivity(tabId, { activatedAt: Date.now(), ...patch });
}

async function refreshAllKnownTabs() {
  const tabs = await chrome.tabs.query({});
  const now = Date.now();
  const tabActivity = await getTabActivity();
  for (const tab of tabs) {
    if (!tab.id) continue;
    const key = String(tab.id);
    tabActivity[key] = {
      ...(tabActivity[key] || {}),
      title: tab.title,
      url: tab.url,
      windowId: tab.windowId,
      lastSeenAt: now,
      activatedAt: tab.active ? now : (tabActivity[key]?.activatedAt || now)
    };
  }
  await chrome.storage.local.set({ [STORAGE_KEYS.tabActivity]: tabActivity });
}

async function getDashboardData() {
  await refreshAllKnownTabs();
  const [settings, tabActivity, tabs, windows, memory] = await Promise.all([
    getSettings(),
    getTabActivity(),
    chrome.tabs.query({}),
    chrome.windows.getAll({ populate: false }),
    getMemoryInfo()
  ]);

  const now = Date.now();
  const enrichedTabs = tabs.map(tab => {
    const activity = tabActivity[String(tab.id)] || {};
    const lastActiveAt = activity.activatedAt || activity.updatedAt || activity.lastSeenAt || now;
    const eligibility = getSuspensionEligibility(tab, settings, now, lastActiveAt);
    return {
      id: tab.id,
      windowId: tab.windowId,
      index: tab.index,
      title: tab.title || '(Untitled)',
      url: tab.url || '',
      favIconUrl: tab.favIconUrl || '',
      active: Boolean(tab.active),
      pinned: Boolean(tab.pinned),
      audible: Boolean(tab.audible),
      discarded: Boolean(tab.discarded),
      autoDiscardable: tab.autoDiscardable !== false,
      groupId: tab.groupId,
      lastActiveAt,
      inactiveSeconds: Math.max(0, Math.floor((now - lastActiveAt) / 1000)),
      eligible: eligibility.eligible,
      reason: eligibility.reason,
      domain: safeDomain(tab.url)
    };
  }).sort((a, b) => a.windowId - b.windowId || a.index - b.index);

  return {
    generatedAt: now,
    settings,
    memory,
    windows: windows.map(window => ({ id: window.id, focused: window.focused, type: window.type })),
    tabs: enrichedTabs,
    counts: {
      totalTabs: enrichedTabs.length,
      discardedTabs: enrichedTabs.filter(tab => tab.discarded).length,
      eligibleTabs: enrichedTabs.filter(tab => tab.eligible).length,
      audibleTabs: enrichedTabs.filter(tab => tab.audible).length,
      pinnedTabs: enrichedTabs.filter(tab => tab.pinned).length
    }
  };
}

async function getMemoryInfo() {
  try {
    const info = await chrome.system.memory.getInfo();
    const capacity = Number(info.capacity || 0);
    const available = Number(info.availableCapacity || 0);
    const used = Math.max(0, capacity - available);
    return {
      availableBytes: available,
      totalBytes: capacity,
      usedBytes: used,
      usedPercent: capacity ? Math.round((used / capacity) * 100) : null
    };
  } catch (error) {
    return { error: error?.message || String(error), availableBytes: null, totalBytes: null, usedBytes: null, usedPercent: null };
  }
}

function getSuspensionEligibility(tab, settings, now = Date.now(), lastActiveAt = Date.now()) {
  const protectedReason = getProtectionReason(tab, settings);
  if (protectedReason) return { eligible: false, reason: protectedReason };
  const inactiveMinutes = (now - lastActiveAt) / 60000;
  if (inactiveMinutes < settings.inactiveMinutes) {
    return { eligible: false, reason: `Inactive for ${Math.floor(inactiveMinutes)}m; threshold is ${settings.inactiveMinutes}m` };
  }
  return { eligible: true, reason: 'Eligible' };
}

function getProtectionReason(tab, settings) {
  if (!tab?.id) return 'Missing tab id';
  if (settings.protectActive && tab.active) return 'Active tab';
  if (settings.protectPinned && tab.pinned) return 'Pinned tab';
  if (settings.protectAudible && tab.audible) return 'Audible tab';
  if (settings.protectDiscarded && tab.discarded) return 'Already suspended';
  if (tab.autoDiscardable === false) return 'Chrome says non-discardable';
  if (!isDiscardableUrl(tab.url)) return 'Unsupported URL';
  if (isAllowlisted(tab.url, settings.allowlist)) return 'Allowlisted';
  return '';
}

function isDiscardableUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:', 'file:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function isAllowlisted(url, allowlist = []) {
  const host = safeDomain(url).toLowerCase();
  const fullUrl = String(url || '').toLowerCase();
  return allowlist.some(entry => {
    const pattern = String(entry || '').trim().toLowerCase();
    if (!pattern) return false;
    if (pattern.startsWith('/') && pattern.endsWith('/') && pattern.length > 2) {
      try { return new RegExp(pattern.slice(1, -1), 'i').test(fullUrl); } catch { return false; }
    }
    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(2);
      return host === suffix || host.endsWith(`.${suffix}`);
    }
    return host === pattern || host.endsWith(`.${pattern}`) || fullUrl.includes(pattern);
  });
}

function safeDomain(url) {
  try { return new URL(url).hostname || ''; } catch { return ''; }
}

async function suspendTab(tabId, reason = 'manual') {
  const id = Number(tabId);
  if (!Number.isFinite(id)) throw new Error('Invalid tab id.');
  const tab = await chrome.tabs.get(id);
  const settings = await getSettings();
  const protectedReason = getProtectionReason(tab, { ...settings, protectActive: reason !== 'manual' && settings.protectActive });
  if (protectedReason && protectedReason !== 'Already suspended') {
    throw new Error(`Cannot suspend tab: ${protectedReason}.`);
  }
  if (tab.discarded) return { tabId: id, discarded: true, alreadyDiscarded: true };
  const discarded = await chrome.tabs.discard(id);
  await updateTabActivity(id, { lastSuspendedAt: Date.now(), suspendReason: reason });
  await logEvent('TAB_SUSPENDED', { tabId: id, reason, discarded: Boolean(discarded?.discarded) });
  return { tabId: id, discarded: Boolean(discarded?.discarded), title: discarded?.title || tab.title };
}

async function restoreTab(tabId) {
  const id = Number(tabId);
  if (!Number.isFinite(id)) throw new Error('Invalid tab id.');
  const tab = await chrome.tabs.get(id);
  await chrome.tabs.update(id, { active: true });
  if (tab.discarded) {
    try {
      await chrome.tabs.reload(id);
    } catch (error) {
      // Selecting a discarded tab normally reloads it. Keep this non-fatal.
    }
  }
  await markTabActive(id, { restoredAt: Date.now() });
  await logEvent('TAB_OPENED_OR_RESTORED', { tabId: id, wasDiscarded: Boolean(tab.discarded) });
  return { tabId: id, restored: true };
}

async function suspendAllEligible(scope = 'all') {
  const settings = await getSettings();
  const tabActivity = await getTabActivity();
  const tabs = await chrome.tabs.query({});
  const now = Date.now();
  const focusedWindowId = (await chrome.windows.getLastFocused())?.id;
  const results = [];
  for (const tab of tabs) {
    if (scope === 'currentWindow' && tab.windowId !== focusedWindowId) continue;
    const lastActiveAt = tabActivity[String(tab.id)]?.activatedAt || now;
    const eligibility = getSuspensionEligibility(tab, settings, now, lastActiveAt);
    if (!eligibility.eligible) continue;
    try {
      results.push({ tabId: tab.id, ok: true, result: await suspendTab(tab.id, 'bulk') });
    } catch (error) {
      results.push({ tabId: tab.id, ok: false, error: error?.message || String(error) });
    }
  }
  return summarizeSuspendResults(results);
}

async function suspendWindowEligible(windowId) {
  const settings = await getSettings();
  const tabActivity = await getTabActivity();
  const tabs = await chrome.tabs.query({ windowId: Number(windowId) });
  const now = Date.now();
  const results = [];
  for (const tab of tabs) {
    const lastActiveAt = tabActivity[String(tab.id)]?.activatedAt || now;
    const eligibility = getSuspensionEligibility(tab, settings, now, lastActiveAt);
    if (!eligibility.eligible) continue;
    try {
      results.push({ tabId: tab.id, ok: true, result: await suspendTab(tab.id, 'window') });
    } catch (error) {
      results.push({ tabId: tab.id, ok: false, error: error?.message || String(error) });
    }
  }
  return summarizeSuspendResults(results);
}

async function runAutoSuspend(source = 'alarm') {
  const settings = await getSettings();
  if (!settings.autoSuspendEnabled) return { source, skipped: true, reason: 'Auto suspend is disabled.' };

  const memory = await getMemoryInfo();
  const effectiveSettings = { ...settings };
  if (settings.autoSuspendOnHighMemory && memory.usedPercent !== null && memory.usedPercent >= settings.memoryWarningPercent) {
    effectiveSettings.inactiveMinutes = Math.min(settings.inactiveMinutes, settings.highMemoryMinutes);
  }

  const tabs = await chrome.tabs.query({});
  const tabActivity = await getTabActivity();
  const now = Date.now();
  const results = [];

  for (const tab of tabs) {
    const lastActiveAt = tabActivity[String(tab.id)]?.activatedAt || now;
    const eligibility = getSuspensionEligibility(tab, effectiveSettings, now, lastActiveAt);
    if (!eligibility.eligible) continue;
    try {
      results.push({ tabId: tab.id, ok: true, result: await suspendTab(tab.id, 'auto') });
    } catch (error) {
      results.push({ tabId: tab.id, ok: false, error: error?.message || String(error) });
    }
  }

  const summary = summarizeSuspendResults(results);
  await chrome.storage.local.set({ [STORAGE_KEYS.lastAutoRun]: { at: now, source, ...summary } });
  await logEvent('AUTO_SUSPEND_RUN', { source, summary });
  return { source, memory, ...summary };
}

function summarizeSuspendResults(results) {
  return {
    attempted: results.length,
    suspended: results.filter(item => item.ok).length,
    failed: results.filter(item => !item.ok).length,
    results
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
