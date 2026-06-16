# Clear Site Data (One Click)

A minimal Chrome (Manifest V3) extension that **clears the current site's data in one click** —
the same result as opening DevTools → **Application → Storage → "Clear site data"** and wiping
everything for that origin. Optionally it auto-refreshes the tab afterward.

## Features

- **Click the icon → clean popup menu** with a big **Clear THIS site now** button on top, plus:
  - **Clear ALL sites' data (everything)** — full browser wipe (cache, cookies, storage,
    downloads…) for all sites and all time. **Requires a confirmation step** in the popup,
    since it logs you out of every site.
  - **Clear browsing history** — browsing + download history.
  - **Choose what to clean…** — a page with per-type checkboxes, an "only this site" scope
    toggle, and a time range (last hour … all time).
  - **Show memory usage…** — current system RAM total / available / in-use.
- **Instant keyboard shortcut.** Press **`Alt+Shift+C`** to clear the current site immediately —
  no clicks, no popup. (Rebind it at `chrome://extensions/shortcuts`.)
- **Total clear for the active site.** Removes cache, cacheStorage, cookies, IndexedDB,
  localStorage, service workers, fileSystems, and webSQL — scoped to the current tab's origin,
  matching DevTools "Clear site data".
- **Optional auto-refresh.** After clearing the active site, reload the tab (cache-bypassed).
  Toggle it in Options.
- **Visual feedback.** A short badge on the icon: `OK` / `ALL` / `HST` (success),
  `ERR` (failed), `n/a` (page can't be cleared, e.g. `chrome://` pages).

> **Why a popup + shortcut instead of single-click / double-click?** Chrome's extension API
> has no double-click event for the toolbar icon, and clicking an icon that has a popup can't
> also run an instant action. So the menu lives in a clean popup (fully app-controlled, unlike
> the right-click menu which Chrome pads with its own items), and the instant one-click clear is
> the `Alt+Shift+C` keyboard shortcut.

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
