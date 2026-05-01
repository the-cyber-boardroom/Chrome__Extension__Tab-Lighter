# Tab Lighter

Tab Lighter is a local Chrome extension for people who want to keep many tabs open without keeping every tab running in memory. It combines a tab-manager dashboard, a Chrome-Task-Manager-inspired status view, and a safer native-tab suspension model.

The extension uses Chrome's native discarded-tab capability through `chrome.tabs.discard()`. A suspended tab remains in the Chrome tab strip and reloads when you open it again. This is intentionally different from older suspender extensions that replaced your page URL with a custom suspended page.

## Current version

**Version:** `0.1.0`  
**Status:** MVP / local-install development build  
**Manifest:** Manifest V3  
**Minimum Chrome version:** 91

## What it does

- Shows all open tabs grouped by Chrome window.
- Shows total tabs, suspended tabs, eligible tabs, audible tabs, and pinned tabs.
- Shows system memory pressure using Chrome's `system.memory` API.
- Lets you manually suspend individual tabs.
- Lets you restore/open suspended tabs.
- Lets you suspend all eligible tabs across all windows.
- Lets you suspend eligible tabs in one window.
- Automatically suspends tabs after a configurable inactivity threshold.
- Protects active, pinned, audible, unsupported, already-suspended, and allowlisted tabs.
- Supports allowlist entries for domains, wildcard domains, URL fragments, and regex patterns.

## Important limitations

Chrome extensions do not expose the same per-process or per-tab memory table that the built-in Chrome Task Manager shows. Tab Lighter therefore shows system-wide memory pressure and tab suspension state, not exact RAM per tab.

Tab suspension uses Chrome's native discarded-tab lifecycle. Restoring a suspended tab reloads the page. Unsaved in-page state may be lost if the site itself does not preserve it.

## Install locally

1. Download or clone this folder.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the `tab-lighter` folder.
6. Pin the Tab Lighter icon from the Chrome toolbar.

## Package for distribution

For local sharing, zip the folder contents, not the parent directory. For Chrome Web Store publication, review `docs/DEVELOPER_GUIDE.md`, `docs/ARCHITECTURE.md`, and `docs/PRIVACY_SECURITY.md` first.

## Documentation

- [User Guide](docs/USER_GUIDE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Developer Guide](docs/DEVELOPER_GUIDE.md)
- [Privacy and Security](docs/PRIVACY_SECURITY.md)
- [Roadmap](docs/ROADMAP.md)
