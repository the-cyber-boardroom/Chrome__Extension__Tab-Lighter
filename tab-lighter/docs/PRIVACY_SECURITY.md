# Privacy and Security

## Summary

Tab Lighter is designed as a local-only extension. It does not send browsing data, tab URLs, settings, or memory data to any server.

## Permissions

### `tabs`

Required to list tabs, show tab metadata, activate tabs, reload tabs, and suspend tabs.

### `storage`

Required to store settings and local tab activity timestamps.

### `alarms`

Required to run auto-suspension checks periodically.

### `system.memory`

Required to show system-level physical memory capacity and available memory.

## Data stored locally

Tab Lighter stores:

- Settings.
- Allowlist entries.
- Recently observed tab ids.
- Tab titles and URLs for activity tracking.
- Last active timestamps.
- Last suspended timestamps.

This data is stored in `chrome.storage.local` inside the user's Chrome profile.

## Data not collected

Tab Lighter does not collect:

- Page content.
- Form contents.
- Keystrokes.
- Cookies.
- Authentication tokens.
- Passwords.
- Browsing data outside Chrome's tab metadata APIs.
- Analytics events.
- Telemetry.

## Network access

The MVP makes no network requests.

## Host permissions

The MVP requests no host permissions. It does not need access to read or modify all websites.

## Security posture

- No remote code execution.
- No external JavaScript libraries.
- No content scripts in the MVP.
- No backend service.
- No dynamic script injection.
- No `eval`.

## User risk

Suspending a tab can cause the page to reload when restored. Unsaved in-page state can be lost if the website itself does not preserve it. Users should allowlist critical workflows.

## Publication considerations

Before publishing to the Chrome Web Store:

- Provide a public privacy policy.
- Keep the permission list minimal.
- Document why `tabs` and `system.memory` are required.
- Avoid adding host permissions unless a future feature truly requires them.
