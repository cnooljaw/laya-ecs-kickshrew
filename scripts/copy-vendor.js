const fs = require("fs");
const path = require("path");

const vendorDir = path.resolve(__dirname, "..", "bin", "js", "debug", "vendor");
const rootDir = path.resolve(__dirname, "..");

// 复制 bitecs ES module
const bitecsSrc = path.join(rootDir, "node_modules", "bitecs", "dist", "index.mjs");
const bitecsDestDir = path.join(vendorDir, "bitecs");
const bitecsDest = path.join(bitecsDestDir, "index.mjs");

fs.mkdirSync(bitecsDestDir, { recursive: true });
fs.copyFileSync(bitecsSrc, bitecsDest);
console.log(`Copied bitecs: ${bitecsSrc} -> ${bitecsDest}`);

// 复制 tslib ES module（如果安装了）
const tslibSrc = path.join(rootDir, "node_modules", "tslib", "tslib.es6.js");
if (fs.existsSync(tslibSrc)) {
  const tslibDestDir = path.join(vendorDir, "tslib");
  const tslibDest = path.join(tslibDestDir, "tslib.es6.js");
  fs.mkdirSync(tslibDestDir, { recursive: true });
  fs.copyFileSync(tslibSrc, tslibDest);
  console.log(`Copied tslib: ${tslibSrc} -> ${tslibDest}`);
}

console.log("Vendor files copied.");