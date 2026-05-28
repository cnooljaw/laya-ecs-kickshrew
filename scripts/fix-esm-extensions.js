const fs = require("fs");
const path = require("path");

const outDir = path.resolve(__dirname, "..", "bin", "js", "debug", "src");

function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  const fileDir = path.dirname(filePath);

  function resolveRelPath(relPath) {
    if (relPath.endsWith(".js") || relPath.endsWith(".ts")) return null; // already has extension
    const absPath = path.resolve(fileDir, relPath);
    // 如果路径指向一个包含 index.js 的目录，解析为目录的 index.js
    if (fs.existsSync(absPath) && fs.statSync(absPath).isDirectory()) {
      const indexPath = path.join(absPath, "index.js");
      if (fs.existsSync(indexPath)) {
        return relPath + "/index.js";
      }
    }
    // 否则直接加 .js
    return relPath + ".js";
  }

  // 给相对路径 from "./xxx" 添加扩展名（同时覆盖 import 和 export ... from）
  content = content.replace(
    /(from\s+"(\.\.?\/[^"]+?))"/g,
    (match, prefix, relPath) => {
      const resolved = resolveRelPath(relPath);
      if (resolved === null) return match;
      return `from "${resolved}"`;
    }
  );
  fs.writeFileSync(filePath, content, "utf8");
}

function walkDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.name.endsWith(".js") && !entry.name.endsWith(".map")) {
      processFile(fullPath);
    }
  }
}

if (!fs.existsSync(outDir)) {
  console.error(`Output directory not found: ${outDir}`);
  process.exit(1);
}

walkDir(outDir);
console.log("ESM extensions fixed.");