const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const srcDir = path.join(rootDir, "assets", "resources", "heros");
const destDir = path.join(rootDir, "bin", "resources", "heros");

if (!fs.existsSync(srcDir)) {
  console.warn(`Hero resource source missing: ${srcDir}`);
  process.exit(0);
}

fs.mkdirSync(destDir, { recursive: true });
for (const fileName of fs.readdirSync(srcDir)) {
  if (!fileName.endsWith(".sk") && !fileName.endsWith(".png")) continue;
  const src = path.join(srcDir, fileName);
  const dest = path.join(destDir, fileName);
  fs.copyFileSync(src, dest);
  console.log(`Copied hero resource: ${src} -> ${dest}`);
}
