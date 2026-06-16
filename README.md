# Clear Site Data (One Click)

A minimal Chrome (Manifest V3) extension that **clears the current site's data in one click** —
the same result as opening DevTools → **Application → Storage → "Clear site data"** and wiping
everything for that origin. Optionally it auto-refreshes the tab afterward.

## Features

- **One click = clear this site.** A single click on the toolbar icon clears immediately
  (no popup, no menu in the way). Removes cache, cacheStorage, cookies, IndexedDB,
  localStorage, service workers, fileSystems, and webSQL — scoped to the current tab's origin.
- **Right-click for more.** Right-clicking the icon opens a menu with:
  - **Clear THIS site's data** — same as a single click.
  - **Clear ALL sites' data (everything)** — full browser wipe (cache, cookies, storage,
    downloads…) for all sites and all time.
  - **Clear browsing history** — browsing + download history.
  - **Choose what to clean…** — a page with per-type checkboxes, an "only this site" scope
    toggle, and a time range (last hour … all time).
  - **Show memory usage…** — current system RAM total / available / in-use.
- **Optional auto-refresh.** After clearing the active site, reload the tab (cache-bypassed).
  Toggle it in Options.
- **Visual feedback.** A short badge on the icon: `OK` / `ALL` / `HST` (success),
  `ERR` (failed), `n/a` (page can't be cleared, e.g. `chrome://` pages).

> **Why right-click instead of double-click?** Chrome's extension API has no double-click event
> for the toolbar icon, so a single click stays instantly responsive while the extra features live
> in the native right-click menu.

## Install (load unpacked)

1. Go to `chrome://extensions`.
2. Enable **Developer mode** (top-right).
3. Click **Load unpacked** and select this folder.
4. Pin the extension to the toolbar.

## Usage

- Click the toolbar icon on any `http`/`https` page → that site's data is cleared.
- The tab auto-refreshes if the option is enabled (it is, by default).

## Options

Right-click the icon → **Options**, or via `chrome://extensions` → Details → Extension options.

- **Automatically refresh the tab after clearing** — on by default.

## Build a distributable

```bash
# Produces dist/clear-site-data-v<version>.zip ready to upload to the Chrome Web Store
node build.js
```

## How "total clear" works

The extension calls [`chrome.browsingData.remove`](https://developer.chrome.com/docs/extensions/reference/api/browsingData)
with `origins: ["https://example.com"]` and every supported data type set to `true`. Scoping by
`origins` is exactly how the browser limits the wipe to the active site, mirroring DevTools'
"Clear site data" button.

## Notes / limitations

- Cannot clear `chrome://`, `about:`, `file://`, or extension pages — Chrome forbids it.
- `appcache` and `webSQL` are deprecated platform features; they're included for completeness and
  are simply no-ops on modern Chrome.
