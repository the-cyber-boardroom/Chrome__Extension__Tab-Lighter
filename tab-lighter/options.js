const DEFAULT_SETTINGS = {
  autoSuspendEnabled: true,
  inactiveMinutes: 45,
  protectPinned: true,
  protectAudible: true,
  protectActive: true,
  protectDiscarded: true,
  protectForms: false,
  allowlist: ['mail.google.com', 'docs.google.com', 'localhost', '127.0.0.1'],
  memoryWarningPercent: 80,
  autoSuspendOnHighMemory: false,
  highMemoryMinutes: 15
};

const fields = [
  'autoSuspendEnabled',
  'inactiveMinutes',
  'protectPinned',
  'protectAudible',
  'protectActive',
  'protectDiscarded',
  'autoSuspendOnHighMemory',
  'memoryWarningPercent',
  'highMemoryMinutes',
  'allowlist'
];

window.addEventListener('DOMContentLoaded', async () => {
  document.querySelector('#settingsForm').addEventListener('submit', save);
  document.querySelector('#resetButton').addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', settings: DEFAULT_SETTINGS });
    fill(DEFAULT_SETTINGS);
    status('Defaults restored.');
  });
  const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
  fill(response.data || DEFAULT_SETTINGS);
});

function fill(settings) {
  for (const id of fields) {
    const input = document.querySelector(`#${id}`);
    if (!input) continue;
    if (input.type === 'checkbox') input.checked = Boolean(settings[id]);
    else if (id === 'allowlist') input.value = (settings.allowlist || []).join('\n');
    else input.value = settings[id];
  }
}

async function save(event) {
  event.preventDefault();
  const settings = collect();
  const response = await chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', settings });
  if (response.ok) {
    fill(response.data);
    status('Settings saved.');
  } else {
    status(response.error || 'Unable to save settings.');
  }
}

function collect() {
  return {
    autoSuspendEnabled: document.querySelector('#autoSuspendEnabled').checked,
    inactiveMinutes: Number(document.querySelector('#inactiveMinutes').value),
    protectPinned: document.querySelector('#protectPinned').checked,
    protectAudible: document.querySelector('#protectAudible').checked,
    protectActive: document.querySelector('#protectActive').checked,
    protectDiscarded: document.querySelector('#protectDiscarded').checked,
    autoSuspendOnHighMemory: document.querySelector('#autoSuspendOnHighMemory').checked,
    memoryWarningPercent: Number(document.querySelector('#memoryWarningPercent').value),
    highMemoryMinutes: Number(document.querySelector('#highMemoryMinutes').value),
    allowlist: document.querySelector('#allowlist').value.split('\n').map(line => line.trim()).filter(Boolean)
  };
}

function status(text) {
  const element = document.querySelector('#status');
  element.textContent = text;
  window.setTimeout(() => { if (element.textContent === text) element.textContent = ''; }, 3200);
}
