# Tab Lighter Developer Guide

## Repository layout

```text
tab-lighter/
  manifest.json
  background.js
  popup.html
  popup.css
  popup.js
  options.html
  options.css
  options.js
  icons/
  docs/
    USER_GUIDE.md
    ARCHITECTURE.md
    DEVELOPER_GUIDE.md
    PRIVACY_SECURITY.md
    ROADMAP.md
```

## Local development

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `tab-lighter` folder.
5. After code changes, click the extension card's reload button.
6. Reopen the popup.

## Debugging

### Service worker

1. Go to `chrome://extensions`.
2. Find Tab Lighter.
3. Click **service worker** under **Inspect views**.
4. Use the Console and Sources panels.

### Popup

1. Right-click the extension popup.
2. Click **Inspect**.
3. Use the Console and Elements panels.

### Options page

Open the options page and use normal DevTools.

## Main APIs

### `chrome.tabs`

Used for tab discovery, activation, reload, and suspension.

Key calls:

```js
chrome.tabs.query({})
chrome.tabs.get(tabId)
chrome.tabs.update(tabId, { active: true })
chrome.tabs.reload(tabId)
chrome.tabs.discard(tabId)
```

### `chrome.storage.local`

Used for settings and tab activity timestamps.

### `chrome.alarms`

Used for periodic auto-suspension checks.

### `chrome.system.memory`

Used for memory pressure display and optional high-memory behavior.

## Message contract

Popup and options pages communicate with the service worker through `chrome.runtime.sendMessage`.

Supported message types:

- `GET_DASHBOARD_DATA`
- `SUSPEND_TAB`
- `RESTORE_TAB`
- `SUSPEND_ALL_ELIGIBLE`
- `SUSPEND_WINDOW_ELIGIBLE`
- `RUN_AUTO_SUSPEND_NOW`
- `GET_SETTINGS`
- `SAVE_SETTINGS`
- `ADD_ALLOWLIST_DOMAIN`

Response shape:

```js
{ ok: true, data: ... }
```

or:

```js
{ ok: false, error: "Human-readable error" }
```

## Adding a feature

### Example: add a "never suspend this domain" button

1. Add a button in `popup.js` near each tab row.
2. Send `ADD_ALLOWLIST_DOMAIN` with `tab.domain`.
3. Refresh dashboard data.
4. Add tests or manual test cases for exact domain and wildcard behavior.

### Example: add keyboard shortcuts

1. Add a `commands` block to `manifest.json`.
2. Add `chrome.commands.onCommand` in `background.js`.
3. Reuse existing functions such as `suspendAllEligible`.

## Manual test plan

### Installation

- Load unpacked extension successfully.
- Popup opens without console errors.
- Options page opens without console errors.

### Dashboard

- Tabs appear grouped by window.
- Search filters by title.
- Search filters by URL.
- Memory card renders.
- Counts update after suspending tabs.

### Suspension

- Non-active HTTP tab can be suspended.
- Suspended tab remains in tab strip.
- Suspended tab shows as suspended in popup.
- Restore opens/reloads the tab.
- Active tab is protected during auto-suspend.
- Pinned tab is protected when setting is enabled.
- Audible tab is protected when setting is enabled.
- `chrome://extensions` or `chrome://settings` is not suspended.

### Auto-suspend

- Set inactivity threshold to 1 minute.
- Wait until a background tab becomes eligible.
- Click **Run auto rules**.
- Confirm eligible tab suspends.

### Allowlist

- Add a domain to the allowlist.
- Open a tab on that domain.
- Confirm it is marked allowlisted and not eligible.

## Build and package

No build step is required. The extension uses plain HTML, CSS, and JavaScript.

To create a zip from the command line:

```bash
cd tab-lighter
zip -r ../tab-lighter.zip . -x "*.DS_Store"
```

## Release checklist

- Bump `version` in `manifest.json`.
- Review requested permissions.
- Review `docs/PRIVACY_SECURITY.md`.
- Test in a clean Chrome profile.
- Test with 100+ tabs.
- Test on macOS, Windows, and Linux when possible.
- Prepare Chrome Web Store screenshots and description.
- Add a privacy policy if publishing publicly.

## Known implementation notes

- `protectForms` exists in settings for future form-detection work, but the MVP does not inject content scripts and does not inspect form state.
- Per-tab memory is intentionally not implemented because standard extensions do not expose Chrome Task Manager's detailed memory table.
- The service worker may be stopped by Chrome between events. All durable state should remain in `chrome.storage.local`.
