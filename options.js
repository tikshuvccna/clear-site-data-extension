const DEFAULT_OPTIONS = { autoRefresh: true };

const checkbox = document.getElementById("autoRefresh");
const status = document.getElementById("status");

function showStatus(text) {
  status.textContent = text;
  setTimeout(() => { status.textContent = ""; }, 1200);
}

// Load saved value.
chrome.storage.sync.get(DEFAULT_OPTIONS, (items) => {
  checkbox.checked = items.autoRefresh;
});

// Save on change.
checkbox.addEventListener("change", () => {
  chrome.storage.sync.set({ autoRefresh: checkbox.checked }, () => {
    showStatus("Saved");
  });
});
