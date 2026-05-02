# Manual Test Checklist

Use this checklist before releasing or sharing a build.

## 1) Load unpacked extension
1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `extension/` folder (not the repository root).
5. Confirm Tab Lighter appears with no load errors.

## 2) Open popup
1. Pin Tab Lighter in Chrome toolbar.
2. Open the popup.
3. Verify layout is readable (header, memory card, controls, tab list visible).
4. Verify popup stays usable with many tabs (scroll appears in tab list area).

## 3) Suspend one tab
1. Open at least 3 normal HTTP/HTTPS tabs.
2. In popup, click **Suspend** on one eligible tab.
3. Confirm the target tab becomes discarded in the list.

## 4) Restore a discarded tab
1. Locate a discarded tab.
2. Click **Open**.
3. Confirm tab is activated and reloads successfully.

## 5) Suspend eligible tabs
1. Keep at least one protected tab (active/pinned/audible) open.
2. Click **Suspend eligible**.
3. Confirm only eligible tabs are suspended.
4. Confirm protected tabs are not suspended.

## 6) Allowlist behavior
1. Open Options page.
2. Add allowlist patterns (domain, wildcard, URL fragment, regex).
3. Save settings.
4. Open matching tabs.
5. Confirm matching tabs are not suspended by manual bulk actions or auto rules.

## 7) Pinned/audible/active protection
1. Pin one tab.
2. Play audio in another tab.
3. Keep one tab active.
4. Run **Suspend eligible** and auto rules.
5. Confirm pinned, audible, and active tabs are not suspended.

## 8) Options persistence
1. Change inactivity threshold and toggle options in Options page.
2. Save.
3. Close/reopen Options page.
4. Confirm settings persist.
5. Reopen popup and verify new behavior reflects saved settings.
