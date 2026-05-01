# Tab Lighter User Guide

## What Tab Lighter is for

Tab Lighter helps you keep tabs available without keeping every tab fully loaded in memory. It is useful when you want to preserve your tab layout, research sessions, documentation pages, tickets, dashboards, and articles, but you do not want each page running JavaScript in the background.

## Core concepts

### Open tab

A normal Chrome tab that may be loaded and running.

### Suspended tab

A Chrome tab that has been discarded by Chrome. The tab remains visible in your tab strip, but the page is unloaded from memory. When you open the tab, Chrome reloads it.

### Eligible tab

A tab that Tab Lighter is allowed to suspend. A tab is not eligible when it is protected, already suspended, active, pinned, audible, unsupported, or allowlisted.

### Allowlist

A list of domains or URL patterns that should never be suspended automatically.

## Opening the dashboard

Click the Tab Lighter toolbar icon. The popup shows:

- System memory pressure.
- Total number of tabs.
- Number of already suspended tabs.
- Number of tabs currently eligible for suspension.
- Tabs grouped by Chrome window.
- A search box for finding tabs by title, URL, or domain.

## Suspending one tab

1. Open the Tab Lighter popup.
2. Find the tab in the list.
3. Click **Suspend**.

The tab remains in Chrome's tab strip. If the tab is active, pinned, audible, unsupported, or already suspended, the button may be disabled or Chrome may reject the suspension.

## Restoring a tab

1. Open the Tab Lighter popup.
2. Find the suspended tab.
3. Click **Restore**.

Tab Lighter activates the tab. Chrome reloads the page if it was suspended.

## Suspending many tabs

Use **Suspend eligible** to suspend every eligible tab across all windows.

Use **Suspend eligible in window** to suspend eligible tabs only in one Chrome window.

## Automatic suspension

Automatic suspension is enabled by default. The default threshold is 45 inactive minutes.

To change this:

1. Open the Tab Lighter popup.
2. Click **Options**.
3. Change **Inactive minutes before suspension**.
4. Click **Save settings**.

## Recommended allowlist entries

Consider allowlisting sites where reloads are disruptive:

- Email and chat apps.
- Document editors.
- Dashboards that should stay live.
- Video or audio apps.
- Local development servers.
- Sites with unsaved form state.

Examples:

```text
mail.google.com
docs.google.com
localhost
127.0.0.1
*.internal.example.com
/important-workflow/
```

## Memory pressure

The memory card shows system-wide physical memory usage. It does not show exact per-tab RAM. Chrome does not provide normal extensions with the same per-tab process memory numbers shown in Chrome Task Manager.

## Safety notes

Suspension reloads the tab when restored. Unsaved form text, in-memory app state, and temporary UI state may be lost unless the website itself preserves them. Pin or allowlist critical tabs.

## Troubleshooting

### A tab did not suspend

Common reasons:

- It is active.
- It is pinned.
- It is playing audio.
- It is already suspended.
- It is allowlisted.
- It uses an unsupported URL such as `chrome://`, `chrome-extension://`, or another browser-internal page.
- Chrome marked it as non-discardable.

### A restored tab reloaded

That is expected. Suspended tabs are unloaded from memory and load again when opened.

### Memory did not drop immediately

Chrome and the operating system decide when freed memory is reclaimed and reported. Some memory may remain cached or reused.
