# Roadmap

## MVP implemented

- Popup dashboard.
- Manual tab suspension.
- Restore/open tab action.
- Batch suspend eligible tabs.
- Window-level batch suspension.
- Auto-suspend timer.
- Allowlist.
- Pinned, audible, active, discarded, unsupported URL protections.
- System memory pressure display.
- Options page.
- Local-only storage.

## Near-term improvements

- Add a per-tab quick allowlist button.
- Add sorting modes: inactive time, domain, window, suspended state.
- Add tab grouping actions.
- Add keyboard shortcuts.
- Add import/export settings.
- Add a session snapshot feature.
- Add user-visible last auto-run status.
- Add better empty/error states.

## Advanced features

- Optional content script to detect dirty forms before suspension.
- Optional badge text showing eligible or suspended tab count.
- Rules engine with per-domain inactivity thresholds.
- Memory-pressure-triggered suggestions.
- Chrome side panel UI.
- Optional sync storage for settings.
- Cross-device session restoration.

## Enterprise / architect-level enhancements

- Managed storage policy support.
- Centralized default allowlist.
- Audit-friendly permission rationale.
- Build pipeline with linting and static analysis.
- Automated browser tests with Puppeteer.
- Versioned architecture decision records.
