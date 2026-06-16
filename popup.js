const statusEl = document.getElementById("status");

// Actions that finish in-place and should show a confirmation in the popup.
const CLEAR_ACTIONS = {
  clearThisSite: "Cleared this site.",
  clearAllSites: "Cleared all sites' data.",
  clearHistory: "Cleared browsing history."
};

// Actions that open a tab — just close the popup afterward.
const OPEN_ACTIONS = new Set(["openClean", "openMemory"]);

document.querySelectorAll("[data-action]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const action = btn.dataset.action;

    chrome.runtime.sendMessage({ type: "action", action }, () => {
      // Ignore lastError; the background handler is fire-and-forget for opens.
      void chrome.runtime.lastError;
    });

    if (OPEN_ACTIONS.has(action)) {
      window.close();
      return;
    }

    statusEl.textContent = CLEAR_ACTIONS[action] || "Done.";
    // Give the badge/clear a beat, then close.
    setTimeout(() => window.close(), 700);
  });
});
