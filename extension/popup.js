const state = { data: null, query: '' };

const $ = selector => document.querySelector(selector);
const tabList = $('#tabList');
const searchInput = $('#searchInput');

window.addEventListener('DOMContentLoaded', () => {
  $('#refreshButton').addEventListener('click', loadDashboard);
  $('#suspendEligibleButton').addEventListener('click', async () => {
    await send({ type: 'SUSPEND_ALL_ELIGIBLE', scope: 'all' });
    await loadDashboard();
  });
  $('#runAutoButton').addEventListener('click', async () => {
    await send({ type: 'RUN_AUTO_SUSPEND_NOW' });
    await loadDashboard();
  });
  $('#optionsButton').addEventListener('click', () => chrome.runtime.openOptionsPage());
  searchInput.addEventListener('input', () => {
    state.query = searchInput.value.trim().toLowerCase();
    render();
  });
  loadDashboard();
});

async function loadDashboard() {
  setStatus('Refreshing…');
  const response = await send({ type: 'GET_DASHBOARD_DATA' });
  if (!response.ok) {
    tabList.innerHTML = `<div class="empty">${escapeHtml(response.error || 'Unable to load tabs.')}</div>`;
    return;
  }
  state.data = response.data;
  render();
}

async function send(message) {
  return chrome.runtime.sendMessage(message);
}

function render() {
  const data = state.data;
  if (!data) return;
  const tabs = filteredTabs(data.tabs);
  setStatus(`${data.counts.totalTabs} tabs • ${data.counts.discardedTabs} suspended • ${data.counts.eligibleTabs} eligible`);
  renderMemory(data.memory, data.settings);
  renderSummary(data.counts);
  renderTabsByWindow(tabs, data.windows);
}

function filteredTabs(tabs) {
  if (!state.query) return tabs;
  return tabs.filter(tab => [tab.title, tab.url, tab.domain].some(value => String(value || '').toLowerCase().includes(state.query)));
}

function setStatus(text) {
  $('#subtitle').textContent = text;
}

function renderMemory(memory, settings) {
  const text = $('#memoryText');
  const bar = $('#memoryBar');
  if (memory?.usedPercent === null || memory?.usedPercent === undefined) {
    text.textContent = 'Unavailable';
    bar.style.width = '0%';
    bar.classList.remove('warning');
    return;
  }
  text.textContent = `${memory.usedPercent}% used (${formatBytes(memory.usedBytes)} of ${formatBytes(memory.totalBytes)})`;
  bar.style.width = `${memory.usedPercent}%`;
  bar.classList.toggle('warning', memory.usedPercent >= settings.memoryWarningPercent);
}

function renderSummary(counts) {
  $('#summary').innerHTML = [
    ['Total', counts.totalTabs],
    ['Suspended', counts.discardedTabs],
    ['Eligible', counts.eligibleTabs],
    ['Audible', counts.audibleTabs],
    ['Pinned', counts.pinnedTabs]
  ].map(([label, value]) => `<div class="summary-item"><strong>${value}</strong><span>${label}</span></div>`).join('');
}

function renderTabsByWindow(tabs, windows) {
  tabList.textContent = '';
  if (!tabs.length) {
    tabList.innerHTML = '<div class="empty">No tabs match your search.</div>';
    return;
  }

  const grouped = new Map();
  for (const tab of tabs) {
    if (!grouped.has(tab.windowId)) grouped.set(tab.windowId, []);
    grouped.get(tab.windowId).push(tab);
  }

  for (const [windowId, windowTabs] of grouped.entries()) {
    const windowInfo = windows.find(item => item.id === windowId);
    const template = $('#windowTemplate').content.cloneNode(true);
    template.querySelector('h2').textContent = `Window ${windowId}${windowInfo?.focused ? ' • focused' : ''} • ${windowTabs.length} tabs`;
    const suspendWindowButton = template.querySelector('.suspend-window-button');
    suspendWindowButton.addEventListener('click', async () => {
      await send({ type: 'SUSPEND_WINDOW_ELIGIBLE', windowId });
      await loadDashboard();
    });
    const container = template.querySelector('.window-tabs');
    for (const tab of windowTabs) container.appendChild(renderTab(tab));
    tabList.appendChild(template);
  }
}

function renderTab(tab) {
  const template = $('#tabTemplate').content.cloneNode(true);
  const row = template.querySelector('.tab-row');
  row.classList.toggle('discarded', tab.discarded);

  const favicon = template.querySelector('.favicon');
  favicon.src = tab.favIconUrl || 'icons/icon16.png';
  favicon.onerror = () => { favicon.src = 'icons/icon16.png'; };

  template.querySelector('.tab-title').textContent = tab.title;
  template.querySelector('.tab-url').textContent = tab.url;
  template.querySelector('.tab-meta').innerHTML = badgesFor(tab).join('');

  const suspendButton = template.querySelector('.suspend-button');
  const restoreButton = template.querySelector('.restore-button');

  suspendButton.disabled = tab.discarded || tab.active || !tab.url;
  suspendButton.title = tab.reason;
  suspendButton.addEventListener('click', async () => {
    await send({ type: 'SUSPEND_TAB', tabId: tab.id });
    await loadDashboard();
  });

  restoreButton.textContent = tab.discarded ? 'Restore' : 'Open';
  restoreButton.addEventListener('click', async () => {
    await send({ type: 'RESTORE_TAB', tabId: tab.id });
    await loadDashboard();
  });

  return template;
}

function badgesFor(tab) {
  const badges = [];
  badges.push(`<span class="badge">${escapeHtml(tab.domain || 'local')}</span>`);
  badges.push(`<span class="badge">inactive ${formatDuration(tab.inactiveSeconds)}</span>`);
  if (tab.active) badges.push('<span class="badge warn">active</span>');
  if (tab.pinned) badges.push('<span class="badge warn">pinned</span>');
  if (tab.audible) badges.push('<span class="badge warn">audible</span>');
  if (tab.discarded) badges.push('<span class="badge ok">suspended</span>');
  badges.push(`<span class="badge ${tab.eligible ? 'ok' : ''}">${escapeHtml(tab.eligible ? 'eligible' : tab.reason)}</span>`);
  return badges;
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ${minutes % 60}m`;
  return `${Math.floor(hours / 24)}d`;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return 'unknown';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit++; }
  return `${value.toFixed(unit < 2 ? 0 : 1)} ${units[unit]}`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}
