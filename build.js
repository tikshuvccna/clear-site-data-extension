// Packages the extension into dist/clear-site-data-v<version>.zip
// Usage: node build.js
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = __dirname;
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
const version = manifest.version;

const distDir = path.join(root, "dist");
fs.mkdirSync(distDir, { recursive: true });

const zipName = `clear-site-data-v${version}.zip`;
const zipPath = path.join(distDir, zipName);
if (fs.existsSync(zipPath)) fs.rmSync(zipPath);

// Files/folders that make up the shippable extension.
const include = [
  "manifest.json",
  "background.js",
  "options.html",
  "options.js",
  "icons"
];

// Verify everything exists before packaging.
for (const item of include) {
  if (!fs.existsSync(path.join(root, item))) {
    console.error(`Missing required file: ${item}`);
    process.exit(1);
  }
}

const fileList = include.join(" ");

try {
  // Prefer PowerShell's Compress-Archive on Windows (always present); fall back to `zip`.
  if (process.platform === "win32") {
    const psItems = include.map((i) => `'${i}'`).join(", ");
    const ps = `Compress-Archive -Path ${psItems} -DestinationPath '${zipPath}' -Force`;
    execSync(`powershell -NoProfile -Command "${ps}"`, { cwd: root, stdio: "inherit" });
  } else {
    execSync(`zip -r "${zipPath}" ${fileList}`, { cwd: root, stdio: "inherit" });
  }
  console.log(`\nBuilt: dist/${zipName}`);
} catch (err) {
  console.error("Packaging failed:", err.message);
  process.exit(1);
}
