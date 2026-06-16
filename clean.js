// Data types that browsingData.remove does NOT support when scoped to origins.
// (Origin-scoped clearing only works for actual site storage.)
const ORIGIN_UNSUPPORTED = new Set(["history", "downloads", "formData", "passwords"]);

const statusEl = document.getElementById("status");

function setStatus(text, color) {
  statusEl.textContent = text;
  statusEl.style.color = color || "#3c4043";
}

function selectedTypes() {
  const result = {};
  document.querySelectorAll("input[data-type]").forEach((cb) => {
    if (cb.checked) result[cb.dataset.type] = true;
  });
  return result;
}

// Get the origin of the tab the user was last on (the active tab in the
// current window, excluding this extension page).
async function currentOrigin() {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  for (const t of tabs) {
    try {
      const u = new URL(t.url);
      if (u.protocol === "http:" || u.protocol === "https:") return u.origin;
    } catch (e) { /* ignore */ }
  }
  return null;
}

document.getElementById("close").addEventListener("click", () => {
  chrome.tabs.getCurrent((tab) => {
    if (tab) chrome.tabs.remove(tab.id);
  });
});

document.getElementById("clear").addEventListener("click", async () => {
  let dataTypes = selectedTypes();
  if (Object.keys(dataTypes).length === 0) {
    setStatus("Select at least one data type.", "#c62828");
    return;
  }

  const since = Number(document.getElementById("range").value) || 0;
  const thisSiteOnly = document.getElementById("thisSiteOnly").checked;

  let origin = null;
  if (thisSiteOnly) {
    origin = await currentOrigin();
    if (!origin) {
      setStatus("Couldn't determine the current site (open a normal http/https tab first).", "#c62828");
      return;
    }
    // Drop types that can't be cleared per-origin so the call doesn't fail.
    const dropped = Object.keys(dataTypes).filter((t) => ORIGIN_UNSUPPORTED.has(t));
    dropped.forEach((t) => delete dataTypes[t]);
    if (Object.keys(dataTypes).length === 0) {
      setStatus("None of the selected types can be cleared per-site. Uncheck 'Only the current site'.", "#c62828");
      return;
    }
    if (dropped.length) {
      setStatus(`Note: ${dropped.join(", ")} can't be cleared per-site and were skipped. Clearing…`, "#9a6700");
    }
  }

  setStatus("Clearing…");
  chrome.runtime.sendMessage(
    { type: "customClear", dataTypes, since, thisSiteOnly, origin },
    (resp) => {
      if (chrome.runtime.lastError) {
        setStatus("Failed: " + chrome.runtime.lastError.message, "#c62828");
        return;
      }
      if (resp && resp.ok) {
        const scope = thisSiteOnly ? `this site (${origin})` : "all sites";
        setStatus(`Done — cleared selected data for ${scope}.`, "#2e7d32");
      } else {
        setStatus("Failed: " + (resp && resp.error ? resp.error : "unknown error"), "#c62828");
      }
    }
  );
});
