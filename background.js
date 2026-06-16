// One-click "Clear site data" for the active tab's origin, plus a right-click
// context menu exposing more features.
//
//   Single click on icon   -> instant total clear of the CURRENT site's data
//                             (like DevTools Application > Storage > "Clear site data").
//   Right-click on icon     -> menu:
//       - Clear THIS site's data (same as single click)
//       - Clear ALL sites' data (every origin)
//       - Clear browsing history
//       - Choose what to clean...  (opens custom page)
//       - Show memory usage...     (opens memory page)

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

// ---- Core actions -------------------------------------------------------

// Clear all data for just the active tab's origin.
async function clearThisSite(tab) {
  if (!tab || !tab.id) return;

  const origin = originForUrl(tab.url);
  if (!origin) {
    await flashBadge(tab.id, "n/a", "#9e9e9e");
    return;
  }

  const { autoRefresh } = await getOptions();

  try {
    await chrome.browsingData.remove({ origins: [origin] }, ALL_DATA_TYPES);
    await flashBadge(tab.id, "OK", "#2e7d32");
    if (autoRefresh) {
      chrome.tabs.reload(tab.id, { bypassCache: true }).catch(() => {});
    }
  } catch (err) {
    console.error("Clear site data failed:", err);
    await flashBadge(tab.id, "ERR", "#c62828");
  }
}

// Clear data for ALL sites (whole browser), all time.
async function clearAllSites(tab) {
  try {
    // No `origins` and no `since` => everything, for all time. Note: not all
    // data types are valid when unscoped; this set is the full browser wipe.
    await chrome.browsingData.remove(
      { since: 0 },
      {
        appcache: true,
        cache: true,
        cacheStorage: true,
        cookies: true,
        downloads: true,
        fileSystems: true,
        indexedDB: true,
        localStorage: true,
        serviceWorkers: true,
        webSQL: true
      }
    );
    if (tab && tab.id) {
      await flashBadge(tab.id, "ALL", "#2e7d32");
      const { autoRefresh } = await getOptions();
      if (autoRefresh && originForUrl(tab.url)) {
        chrome.tabs.reload(tab.id, { bypassCache: true }).catch(() => {});
      }
    }
  } catch (err) {
    console.error("Clear all sites failed:", err);
    if (tab && tab.id) await flashBadge(tab.id, "ERR", "#c62828");
  }
}

// Clear browsing + download history (all time).
async function clearHistory(tab) {
  try {
    await chrome.browsingData.remove({ since: 0 }, { history: true, downloads: true });
    if (tab && tab.id) await flashBadge(tab.id, "HST", "#2e7d32");
  } catch (err) {
    console.error("Clear history failed:", err);
    if (tab && tab.id) await flashBadge(tab.id, "ERR", "#c62828");
  }
}

// ---- Context menu -------------------------------------------------------

const MENU = {
  thisSite: "clear-this-site",
  allSites: "clear-all-sites",
  history: "clear-history",
  custom: "choose-what",
  memory: "show-memory"
};

function buildMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU.thisSite,
      title: "Clear THIS site's data",
      contexts: ["action"]
    });
    chrome.contextMenus.create({
      id: MENU.allSites,
      title: "Clear ALL sites' data (everything)",
      contexts: ["action"]
    });
    chrome.contextMenus.create({
      id: MENU.history,
      title: "Clear browsing history",
      contexts: ["action"]
    });
    chrome.contextMenus.create({
      id: "sep1",
      type: "separator",
      contexts: ["action"]
    });
    chrome.contextMenus.create({
      id: MENU.custom,
      title: "Choose what to clean…",
      contexts: ["action"]
    });
    chrome.contextMenus.create({
      id: MENU.memory,
      title: "Show memory usage…",
      contexts: ["action"]
    });
  });
}

chrome.runtime.onInstalled.addListener(buildMenu);
chrome.runtime.onStartup.addListener(buildMenu);

chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case MENU.thisSite:
      clearThisSite(tab);
      break;
    case MENU.allSites:
      clearAllSites(tab);
      break;
    case MENU.history:
      clearHistory(tab);
      break;
    case MENU.custom:
      chrome.tabs.create({ url: chrome.runtime.getURL("clean.html") });
      break;
    case MENU.memory:
      chrome.tabs.create({ url: chrome.runtime.getURL("memory.html") });
      break;
  }
});

// ---- Keyboard shortcut = instant clear of current site ------------------

async function activeTab() {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tabs[0] || null;
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "clear-this-site") {
    const tab = await activeTab();
    if (tab) clearThisSite(tab);
  }
});

// ---- Messages from the popup and the "Choose what to clean" page ---------

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg) return;

  // Named actions triggered from the popup menu.
  if (msg.type === "action") {
    (async () => {
      const tab = await activeTab();
      switch (msg.action) {
        case "clearThisSite": await clearThisSite(tab); break;
        case "clearAllSites": await clearAllSites(tab); break;
        case "clearHistory":  await clearHistory(tab);  break;
        case "openClean":     chrome.tabs.create({ url: chrome.runtime.getURL("clean.html") }); break;
        case "openMemory":    chrome.tabs.create({ url: chrome.runtime.getURL("memory.html") }); break;
      }
      sendResponse({ ok: true });
    })();
    return true;
  }

  // Custom clear from clean.html.
  if (msg.type === "customClear") {
    const removalOptions = {};
    if (typeof msg.since === "number") removalOptions.since = msg.since;
    if (msg.thisSiteOnly && msg.origin) removalOptions.origins = [msg.origin];

    chrome.browsingData.remove(removalOptions, msg.dataTypes || {}).then(
      () => sendResponse({ ok: true }),
      (err) => sendResponse({ ok: false, error: String(err) })
    );
    return true; // keep the message channel open for the async response
  }
});
