/**
 * rebuild-atlases.ts — 将所有 Cocos plist 重新转换为 Laya .atlas JSON
 *
 * 修复：对 rotated 帧，交换 frame.w/h 以匹配 atlas 中的实际像素区域尺寸
 * 运行: npx ts-node src/resource/rebuild-atlases.ts
 */
import * as fs from "fs";
import * as path from "path";
import { parsePlistXml, convertPlistToAtlas } from "./PlistConverter";

const RESOURCES_DIR = path.resolve(__dirname, "../../assets/resources/kickshrew");
const BIN_DIR = path.resolve(__dirname, "../../bin/resources/kickshrew");

function rebuildAllAtlases() {
  const files = fs.readdirSync(RESOURCES_DIR);
  const plistFiles = files.filter((f) => f.endsWith(".plist"));

  let converted = 0;
  let skipped = 0;

  for (const plistFile of plistFiles) {
    const plistPath = path.join(RESOURCES_DIR, plistFile);
    const atlasName = plistFile.replace(".plist", ".atlas");
    const atlasAssetsPath = path.join(RESOURCES_DIR, atlasName);
    const atlasBinPath = path.join(BIN_DIR, atlasName);

    try {
      const xml = fs.readFileSync(plistPath, "utf-8");
      const atlas = convertPlistToAtlas(xml);
      const json = JSON.stringify(atlas, null, 2) + "\n";

      // 写入 assets/ 目录
      fs.writeFileSync(atlasAssetsPath, json, "utf-8");
      // 写入 bin/ 目录
      fs.writeFileSync(atlasBinPath, json, "utf-8");

      // 统计 rotated 帧数量
      const rotatedCount = Object.values(atlas.frames).filter(
        (f: any) => f.rotated
      ).length;
      if (rotatedCount > 0) {
        console.log(`  ✓ ${plistFile} → ${atlasName} (${rotatedCount} rotated frames swapped)`);
      } else {
        console.log(`  ✓ ${plistFile} → ${atlasName} (no rotated frames)`);
      }
      converted++;
    } catch (err: any) {
      console.error(`  ✗ ${plistFile}: ${err.message}`);
      skipped++;
    }
  }

  console.log(`\nDone: ${converted} converted, ${skipped} skipped`);
}

rebuildAllAtlases();
