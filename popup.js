const statusEl = document.getElementById("status");
const confirmPanel = document.getElementById("confirm");

// Actions that finish in-place and should show a confirmation in the popup.
const CLEAR_ACTIONS = {
  clearThisSite: "Cleared this site.",
  clearAllSites: "Cleared all sites' data.",
  clearHistory: "Cleared browsing history."
};

// Actions that open a tab — just close the popup afterward.
const OPEN_ACTIONS = new Set(["openClean", "openMemory"]);

// Send an action to the background worker, show status, then close the popup.
function runAction(action) {
  chrome.runtime.sendMessage({ type: "action", action }, () => {
    void chrome.runtime.lastError; // fire-and-forget
  });

  if (OPEN_ACTIONS.has(action)) {
    window.close();
    return;
  }

  statusEl.textContent = CLEAR_ACTIONS[action] || "Done.";
  setTimeout(() => window.close(), 700);
}

document.querySelectorAll("[data-action]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const action = btn.dataset.action;

    // The destructive "wipe everything" action needs explicit confirmation.
    if (action === "clearAllSites") {
      confirmPanel.classList.add("show");
      return;
    }

    runAction(action);
  });
});

// Confirmation panel wiring for "Clear ALL sites' data".
document.getElementById("confirmCancel").addEventListener("click", () => {
  confirmPanel.classList.remove("show");
});
document.getElementById("confirmGo").addEventListener("click", () => {
  confirmPanel.classList.remove("show");
  runAction("clearAllSites");
});
