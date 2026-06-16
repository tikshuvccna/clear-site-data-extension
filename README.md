# Clear Site Data (One Click)

A minimal Chrome (Manifest V3) extension that **clears the current site's data in one click** —
the same result as opening DevTools → **Application → Storage → "Clear site data"** and wiping
everything for that origin. Optionally it auto-refreshes the tab afterward.

## Features

- **One click, no menu.** Clicking the toolbar icon clears immediately (no popup, no context menu).
- **Total clear for the active site.** Removes cache, cacheStorage, cookies, IndexedDB,
  localStorage, service workers, fileSystems, and webSQL — scoped to the current tab's origin.
- **Optional auto-refresh.** After clearing, reload the tab (cache-bypassed). Toggle it in Options.
- **Visual feedback.** A short badge on the icon: `OK` (success), `ERR` (failed), `n/a`
  (page can't be cleared, e.g. `chrome://` pages).

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
