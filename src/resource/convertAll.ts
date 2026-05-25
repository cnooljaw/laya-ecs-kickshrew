/**
 * 批量转换脚本：将 assets/resources/kickshrew/ 下所有 .plist 文件转为 Laya .atlas JSON
 * 运行: npx ts-node src/resource/convertAll.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { convertPlistToAtlas } from './PlistConverter';

const RESOURCES_DIR = path.resolve(__dirname, '../../assets/resources/kickshrew');

function convertAll() {
  const files = fs.readdirSync(RESOURCES_DIR).filter(f => f.endsWith('.plist'));

  let success = 0;
  let failed = 0;

  for (const plistFile of files) {
    const plistPath = path.join(RESOURCES_DIR, plistFile);
    const atlasFile = plistFile.replace('.plist', '.atlas');
    const atlasPath = path.join(RESOURCES_DIR, atlasFile);

    try {
      const xml = fs.readFileSync(plistPath, 'utf-8');
      const atlas = convertPlistToAtlas(xml);
      fs.writeFileSync(atlasPath, JSON.stringify(atlas, null, 2), 'utf-8');
      const frameCount = Object.keys(atlas.frames).length;
      console.log(`  OK  ${plistFile} → ${atlasFile} (${frameCount} frames)`);
      success++;
    } catch (e) {
      console.error(`  FAIL ${plistFile}: ${(e as Error).message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${success} converted, ${failed} failed`);
}

convertAll();
