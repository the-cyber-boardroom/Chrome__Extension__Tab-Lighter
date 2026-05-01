# Tab Lighter Architecture

## Goals

Tab Lighter is designed to reduce browser memory pressure while preserving the user's tab topology. The extension favors Chrome-native lifecycle operations over URL replacement or page hijacking.

## Non-goals

- It does not replicate Chrome Task Manager's exact per-process memory table.
- It does not inspect arbitrary page contents.
- It does not inject content scripts into every website in the MVP.
- It does not sync data to a server.
- It does not replace Chrome's built-in tab strip or history.

## High-level design

```text
+-------------------+       message passing       +------------------------+
| popup.html/js/css | <--------------------------> | background service     |
| Dashboard UI      |                              | worker                 |
+-------------------+                              +-----------+------------+
                                                            |
                                                            |
+----------------------+       message passing       +-------v----------------+
| options.html/js/css  | <--------------------------> | Chrome extension APIs  |
| Settings UI          |                              | tabs/storage/alarms/   |
+----------------------+                              | system.memory          |
                                                      +------------------------+
```

## Components

### `manifest.json`

Declares Manifest V3 metadata, the service worker, popup, options page, icons, and permissions.

Permissions:

- `tabs`: enumerate, activate, reload, and discard tabs.
- `storage`: persist user settings and lightweight tab activity state.
- `alarms`: run periodic auto-suspend checks.
- `system.memory`: show system-level physical memory pressure.

### `background.js`

The main application controller. Responsibilities:

- Initialize default settings.
- Track tab activity timestamps.
- Respond to popup and options messages.
- Evaluate suspension eligibility.
- Call `chrome.tabs.discard()` for suspension.
- Activate and reload tabs during restore.
- Run automatic suspension through `chrome.alarms`.
- Query `chrome.system.memory.getInfo()` for memory pressure.

### `popup.html`, `popup.css`, `popup.js`

The operational dashboard. Responsibilities:

- Display memory pressure.
- Display tab counts.
- Group tabs by window.
- Search tabs.
- Trigger manual suspension, restoration, and batch actions.

### `options.html`, `options.css`, `options.js`

The configuration UI. Responsibilities:

- Edit auto-suspend threshold.
- Enable or disable automatic suspension.
- Configure protected tab types.
- Configure memory-pressure behavior.
- Edit the allowlist.

## Data model

### Settings

Stored in `chrome.storage.local` under key `settings`.

```js
{
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
}
```

### Tab activity

Stored in `chrome.storage.local` under key `tabActivity`, keyed by Chrome tab id.

```js
{
  "123": {
    title: "Example",
    url: "https://example.com",
    windowId: 1,
    lastSeenAt: 1710000000000,
    updatedAt: 1710000000000,
    activatedAt: 1710000000000,
    lastSuspendedAt: 1710000000000,
    suspendReason: "auto"
  }
}
```

Tab ids are session-local. The store is pruned when tabs are removed and refreshed when the extension starts or the popup opens.

## Suspension algorithm

For each tab:

1. Reject if the tab id is missing.
2. Reject protected active tabs.
3. Reject protected pinned tabs.
4. Reject protected audible tabs.
5. Reject already suspended tabs.
6. Reject tabs Chrome marks as `autoDiscardable === false`.
7. Reject unsupported URLs.
8. Reject allowlisted URLs.
9. Compare inactivity age against the configured threshold.
10. If eligible, call `chrome.tabs.discard(tabId)`.

## URL eligibility

The MVP only suspends these URL schemes:

- `http:`
- `https:`
- `file:`

It avoids browser-internal and extension pages.

## Allowlist matching

Allowlist entries support:

- Exact domains: `docs.google.com`
- Domain suffixes: `google.com`
- Wildcards: `*.example.com`
- URL fragments: `jira/browse/ABC`
- Regex patterns: `/\/checkout\/step-/`

## Memory model

The extension uses `chrome.system.memory.getInfo()` to retrieve physical memory capacity and available capacity. Used memory is calculated as:

```text
usedBytes = capacity - availableCapacity
usedPercent = usedBytes / capacity * 100
```

This is not equivalent to per-tab memory usage.

## Service worker lifecycle

Manifest V3 service workers are event-driven. The extension does not assume a permanently running background page. Periodic behavior is scheduled through `chrome.alarms`, and state is persisted in `chrome.storage.local`.

## Failure modes

- `chrome.tabs.discard()` may reject active, special, or non-discardable tabs.
- Memory info may be unavailable on unsupported environments.
- Tab ids can become stale between popup rendering and button click.
- Restoring a discarded tab requires page reload and may lose unsaved website state.

## Extension boundaries

Tab Lighter does not need host permissions because it does not inspect or alter webpage content. This keeps the permission surface small.
