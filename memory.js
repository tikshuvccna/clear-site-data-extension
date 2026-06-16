function fmtGB(bytes) {
  return (bytes / (1024 ** 3)).toFixed(2) + " GB";
}

function update() {
  chrome.system.memory.getInfo((info) => {
    const total = info.capacity;
    const avail = info.availableCapacity;
    const used = total - avail;
    const pct = total > 0 ? Math.round((used / total) * 100) : 0;

    document.getElementById("total").textContent = fmtGB(total);
    document.getElementById("avail").textContent = fmtGB(avail);
    document.getElementById("used").textContent = fmtGB(used);
    document.getElementById("barFill").style.width = pct + "%";
    document.getElementById("pct").textContent = pct + "% in use";
  });
}

document.getElementById("refresh").addEventListener("click", update);
update();
