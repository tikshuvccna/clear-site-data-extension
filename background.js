// One-click "Clear site data" for the active tab's origin.
// Behaves like DevTools Application > Storage > "Clear site data": it wipes
// cache, cookies, and every kind of site storage scoped to the current origin.

const ALL_DATA_TYPES = {
  appcache: true,
  cache: true,
  cacheStorage: true,
  cookies: true,
  fileSystems: true,
  indexedDB: true,
  localStorage: true,
  serviceWorkers: true,
  webSQL: true
};

const DEFAULT_OPTIONS = { autoRefresh: true };

function getOptions() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_OPTIONS, (items) => resolve(items));
  });
}

// Derive the origin (scheme://host[:port]) for a tab's URL.
function originForUrl(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.origin;
  } catch (e) {
    return null;
  }
}

async function flashBadge(tabId, text, color) {
  try {
    await chrome.action.setBadgeBackgroundColor({ color, tabId });
    await chrome.action.setBadgeText({ text, tabId });
    setTimeout(() => {
      chrome.action.setBadgeText({ text: "", tabId }).catch(() => {});
    }, 2000);
  } catch (e) {
    /* tab may have closed */
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id) return;

  const origin = originForUrl(tab.url);
  if (!origin) {
    // Can't clear data for chrome://, about:, file://, extension pages, etc.
    await flashBadge(tab.id, "n/a", "#9e9e9e");
    return;
  }

  const { autoRefresh } = await getOptions();

  try {
    await chrome.browsingData.remove(
      {
        // Scope the wipe to just this origin — "Active site only".
        origins: [origin]
      },
      ALL_DATA_TYPES
    );

    await flashBadge(tab.id, "OK", "#2e7d32");

    if (autoRefresh) {
      // Bypass cache on reload so the fresh page isn't served from a stale copy.
      chrome.tabs.reload(tab.id, { bypassCache: true }).catch(() => {});
    }
  } catch (err) {
    console.error("Clear site data failed:", err);
    await flashBadge(tab.id, "ERR", "#c62828");
  }
});
