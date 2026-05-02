# Chrome__Extension__Tab-Lighter

Tab Lighter is a local-first, privacy-conscious Manifest V3 Chrome extension for reducing memory pressure from inactive tabs. It combines:
- a tab manager-style dashboard,
- a lightweight memory pressure view,
- and native Chrome tab suspension (`chrome.tabs.discard`).

## Feature Summary
- Grouped tab inventory by browser window.
- Search by tab title, URL, or domain.
- One-click suspend for individual tabs.
- Bulk **Suspend eligible** actions (global and per-window).
- Restore/open discarded tabs directly from popup.
- Auto-suspend rules based on tab inactivity threshold.
- Protection rules for active, pinned, audible, unsupported, and allowlisted tabs.
- Allowlist support for domains, wildcard domains, URL fragments, and regex patterns.

## Local Installation (Unpacked)
1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `extension/` folder (not the repository root).
5. Pin Tab Lighter in the Chrome toolbar.

## Development Workflow
1. Make changes inside `extension/` (plain HTML/CSS/JS + Manifest V3).
2. Run validation:
   - `./scripts/validate-extension.sh`
3. Reload the extension in `chrome://extensions`.
4. Run manual checklist in `tests/README.md`.
5. Build distributable ZIP when needed:
   - `./scripts/zip-extension.sh`

## Repository Structure
```
Chrome__Extension__Tab-Lighter/
├── extension/                 # Chrome extension source (load this folder)
├── docs/                      # Product and engineering documentation
├── scripts/                   # Validation and packaging scripts
├── tests/                     # Manual test plans
├── README.md                  # Project overview and setup
├── LICENSE
└── .gitignore
```

## Privacy & Security Summary
- Local-first behavior: extension logic runs in-browser.
- No remote backend dependency required for core functionality.
- Uses Chrome APIs required for tab management and memory telemetry.
- Suspension uses native Chrome tab discard lifecycle (tabs stay in strip and reload on reopen).

See detailed documentation:
- [User Guide](docs/USER_GUIDE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Developer Guide](docs/DEVELOPER_GUIDE.md)
- [Privacy & Security](docs/PRIVACY_SECURITY.md)
- [Roadmap](docs/ROADMAP.md)
