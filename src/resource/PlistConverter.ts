/**
 * PlistConverter — 离线工具：将 Cocos2d-x plist XML 格式转换为 Laya .atlas JSON 格式
 *
 * Cocos plist 帧格式:
 *   frame: {{x,y},{w,h}}           — 在纹理图集中的位置和大小
 *   offset: {x,y}                  — 相对于 sourceSize 中心的偏移
 *   rotated: bool                  — 是否顺时针旋转90度
 *   sourceColorRect: {{x,y},{w,h}} — 裁剪后的精灵在原图中的位置
 *   sourceSize: {w,h}              — 原始未裁剪尺寸
 *
 * Laya atlas 帧格式:
 *   frame: {x,y,w,h}               — 在纹理图集中的位置和大小
 *   rotated: bool                   — 是否旋转
 *   trimmed: bool                   — 是否被裁剪过
 *   spriteSourceSize: {x,y,w,h}    — 裁剪后的精灵在原图中的位置
 *   sourceSize: {w,h}              — 原始未裁剪尺寸
 */

// ---- 解析工具函数 ----

/** 解析 Cocos plist 的 point 字符串 "{w,h}" */
export function parsePointStr(str: string): { w: number; h: number } {
  const m = str.match(/\{\s*(-?\d+)\s*,\s*(-?\d+)\s*\}/);
  if (!m) throw new Error(`Invalid point string: ${str}`);
  return { w: parseInt(m[1], 10), h: parseInt(m[2], 10) };
}

/** 解析 Cocos plist 的 rect 字符串 "{{x,y},{w,h}}" */
export function parseRectStr(str: string): { x: number; y: number; w: number; h: number } {
  const m = str.match(/\{\s*\{\s*(-?\d+)\s*,\s*(-?\d+)\s*\}\s*,\s*\{\s*(-?\d+)\s*,\s*(-?\d+)\s*\}\s*\}/);
  if (!m) throw new Error(`Invalid rect string: ${str}`);
  return {
    x: parseInt(m[1], 10),
    y: parseInt(m[2], 10),
    w: parseInt(m[3], 10),
    h: parseInt(m[4], 10),
  };
}

/** 解析 offset 字符串 "{x,y}" */
function parseOffsetStr(str: string): { x: number; y: number } {
  const m = str.match(/\{\s*(-?\d+)\s*,\s*(-?\d+)\s*\}/);
  if (!m) throw new Error(`Invalid offset string: ${str}`);
  return { x: parseInt(m[1], 10), y: parseInt(m[2], 10) };
}

// ---- plist XML 解析 ----

interface PlistFrame {
  frame: { x: number; y: number; w: number; h: number };
  offset: { x: number; y: number };
  rotated: boolean;
  sourceColorRect: { x: number; y: number; w: number; h: number };
  sourceSize: { w: number; h: number };
}

interface PlistMeta {
  textureFileName: string;
  size: { w: number; h: number };
}

interface PlistData {
  frames: Record<string, PlistFrame>;
  meta: PlistMeta;
}

/**
 * 解析 Cocos plist XML 字符串，提取帧数据
 * 使用简单的状态机解析，无 DOM 依赖，可在 Node 和浏览器运行
 */
export function parsePlistXml(xml: string): PlistData {
  const frames: Record<string, PlistFrame> = {} as any;
  let meta: PlistMeta = { textureFileName: '', size: { w: 0, h: 0 } };

  // 提取 <dict> ... </dict> 的内容，先找 frames 区域，再找 metadata 区域
  // 简化解析：用正则提取 key-value 对

  // 获取顶层 dict 内容
  const topDictMatch = xml.match(/<plist[^>]*>\s*<dict>([\s\S]*)<\/dict>\s*<\/plist>/);
  if (!topDictMatch) throw new Error('Invalid plist XML: missing top-level dict');

  const topContent = topDictMatch[1];

  // 找到 frames dict 的范围
  const framesStart = topContent.indexOf('<key>frames</key>');
  if (framesStart === -1) throw new Error('Invalid plist XML: missing frames key');

  // 找到 frames dict 的 <dict> 开始标签
  const framesDictStart = topContent.indexOf('<dict>', framesStart);
  // 找到对应的 </dict> 结束标签
  const framesDictEnd = findMatchingDictEnd(topContent, framesDictStart);
  const framesContent = topContent.substring(framesDictStart + 7, framesDictEnd);

  // 解析 frames: 每个 key → dict
  const frameEntries = parseDictEntries(framesContent);
  for (const [frameName, frameDict] of frameEntries) {
    const props = parseDictAsMap(frameDict);
    frames[frameName] = {
      frame: parseRectStr(getStringProp(props, 'frame')),
      offset: parseOffsetStr(getStringProp(props, 'offset')),
      rotated: getBoolProp(props, 'rotated'),
      sourceColorRect: parseRectStr(getStringProp(props, 'sourceColorRect')),
      sourceSize: parsePointStr(getStringProp(props, 'sourceSize')),
    };
  }

  // 找到 metadata dict 的范围
  const metaStart = topContent.indexOf('<key>metadata</key>');
  if (metaStart !== -1) {
    const metaDictStart = topContent.indexOf('<dict>', metaStart);
    const metaDictEnd = findMatchingDictEnd(topContent, metaDictStart);
    const metaContent = topContent.substring(metaDictStart + 7, metaDictEnd);
    const metaProps = parseDictAsMap(metaContent);

    meta = {
      textureFileName: getStringProp(metaProps, 'realTextureFileName') || getStringProp(metaProps, 'textureFileName') || '',
      size: parsePointStr(getStringProp(metaProps, 'size')),
    };
  }

  return { frames, meta };
}

// ---- Laya atlas 格式 ----

export interface AtlasFrame {
  frame: { x: number; y: number; w: number; h: number };
  rotated: boolean;
  trimmed: boolean;
  spriteSourceSize: { x: number; y: number; w: number; h: number };
  sourceSize: { w: number; h: number };
}

export interface LayaAtlas {
  frames: Record<string, AtlasFrame>;
  meta: {
    image: string;
    size: { w: number; h: number };
  };
}

/**
 * 将 Cocos plist XML 转换为 Laya .atlas JSON 对象
 *
 * 关键转换规则:
 * 1. frame 名去掉 .png 后缀 (Laya 使用不带后缀的帧名)
 * 2. sourceColorRect → spriteSourceSize
 * 3. trimmed = sourceSize 与 frame 尺寸不同时为 true
 */
export function convertPlistToAtlas(xml: string): LayaAtlas {
  const plist = parsePlistXml(xml);
  const atlasFrames: Record<string, AtlasFrame> = {};

  for (const [name, pf] of Object.entries(plist.frames)) {
    // 去掉 .png 后缀
    const atlasName = name.replace(/\.png$/, '');

    // 判断是否 trimmed: 如果 sourceSize 与 frame 尺寸不同，则被裁剪过
    // 注意：对 rotated 帧，frame.w/h 是原始尺寸（Cocos 格式2），不是 atlas 区域尺寸
    // 需要交换 frame.w/h 才能得到 atlas 中的实际区域尺寸
    const trimmed = pf.sourceSize.w !== pf.frame.w || pf.sourceSize.h !== pf.frame.h;

    // 对 rotated 帧：Cocos plist 格式2 的 frame.w/h 是原始（未旋转）尺寸
    // Laya AtlasLoader 忽略 rotated 标志，直接用 frame 矩阵提取纹理
    // 所以必须交换 w/h，让 frame 描述 atlas 中的实际像素区域
    const frameW = pf.rotated ? pf.frame.h : pf.frame.w;
    const frameH = pf.rotated ? pf.frame.w : pf.frame.h;

    // 对 rotated 帧，spriteSourceSize 和 sourceSize 需要适配 Laya 的坐标系：
    // Laya AtlasLoader 在 rotated=true 时会交换 sourceSize.w/h，
    // 然后用 sourceSize - spriteSourceSize 计算边距，如果 spriteSourceSize 未调整，
    // 就会导致宽高超出交换后的 sourceSize，产生负数边距。
    // 旋转帧的变换公式：
    //   spriteSourceSize.x' = sourceColorRect.y
    //   spriteSourceSize.y' = sourceSize.w - sourceColorRect.x - sourceColorRect.w
    //   spriteSourceSize.w' = sourceColorRect.h
    //   spriteSourceSize.h' = sourceColorRect.w
    //   sourceSize = { w: original.h, h: original.w }
    const spriteSourceSize = pf.rotated ? {
      x: pf.sourceColorRect.y,
      y: pf.sourceSize.w - pf.sourceColorRect.x - pf.sourceColorRect.w,
      w: pf.sourceColorRect.h,
      h: pf.sourceColorRect.w,
    } : { ...pf.sourceColorRect };
    const sourceSize = pf.rotated
      ? { w: pf.sourceSize.h, h: pf.sourceSize.w }
      : { ...pf.sourceSize };

    atlasFrames[atlasName] = {
      frame: { x: pf.frame.x, y: pf.frame.y, w: frameW, h: frameH },
      rotated: pf.rotated,
      trimmed,
      spriteSourceSize,
      sourceSize,
    };
  }

  return {
    frames: atlasFrames,
    meta: {
      image: plist.meta.textureFileName,
      size: plist.meta.size,
    },
  };
}

// ---- XML 解析辅助函数 ----

/** 找到匹配的 </dict> 结束位置，处理嵌套 */
function findMatchingDictEnd(content: string, dictStart: number): number {
  let depth = 0;
  let i = dictStart;
  while (i < content.length) {
    const openIdx = content.indexOf('<dict>', i);
    const closeIdx = content.indexOf('</dict>', i);

    if (closeIdx === -1) throw new Error('Unmatched <dict> tag');

    if (openIdx !== -1 && openIdx < closeIdx) {
      depth++;
      i = openIdx + 7;
    } else {
      depth--;
      if (depth === 0) return closeIdx;
      i = closeIdx + 8;
    }
  }
  throw new Error('Unmatched <dict> tag');
}

/** 解析 <dict> 中的 key-dict 对，返回 [key, innerContent][] */
function parseDictEntries(dictContent: string): [string, string][] {
  const entries: [string, string][] = [];
  let pos = 0;

  while (pos < dictContent.length) {
    // 找下一个 <key>
    const keyStart = dictContent.indexOf('<key>', pos);
    if (keyStart === -1) break;

    const keyEnd = dictContent.indexOf('</key>', keyStart);
    if (keyEnd === -1) break;

    const key = dictContent.substring(keyStart + 5, keyEnd);

    // 找对应的 <dict>
    const dictStart = dictContent.indexOf('<dict>', keyEnd);
    if (dictStart === -1) break;

    const dictEnd = findMatchingDictEnd(dictContent, dictStart);
    const innerContent = dictContent.substring(dictStart + 7, dictEnd);

    entries.push([key, innerContent]);
    pos = dictEnd + 8;
  }

  return entries;
}

/** 将 <dict> 内容解析为 Map<key, valueXml> */
function parseDictAsMap(dictContent: string): Map<string, string> {
  const map = new Map<string, string>();
  let pos = 0;

  while (pos < dictContent.length) {
    const keyStart = dictContent.indexOf('<key>', pos);
    if (keyStart === -1) break;

    const keyEnd = dictContent.indexOf('</key>', keyStart);
    if (keyEnd === -1) break;

    const key = dictContent.substring(keyStart + 5, keyEnd);

    // 跳过空白找到值标签
    let valuePos = keyEnd + 6;
    while (valuePos < dictContent.length && dictContent[valuePos] !== '<') {
      valuePos++;
    }

    if (valuePos >= dictContent.length) break;

    // 读取值标签
    const tagEnd = dictContent.indexOf('>', valuePos);
    if (tagEnd === -1) break;

    const tag = dictContent.substring(valuePos, tagEnd + 1);

    if (tag === '<string>') {
      const strEnd = dictContent.indexOf('</string>', tagEnd);
      if (strEnd === -1) break;
      map.set(key, dictContent.substring(tagEnd + 1, strEnd));
      pos = strEnd + 9;
    } else if (tag === '<true/>') {
      map.set(key, 'true');
      pos = tagEnd + 1;
    } else if (tag === '<false/>') {
      map.set(key, 'false');
      pos = tagEnd + 1;
    } else if (tag === '<integer>') {
      const intEnd = dictContent.indexOf('</integer>', tagEnd);
      if (intEnd === -1) break;
      map.set(key, dictContent.substring(tagEnd + 1, intEnd));
      pos = intEnd + 10;
    } else {
      // 未知标签，跳过
      pos = tagEnd + 1;
    }
  }

  return map;
}

function getStringProp(map: Map<string, string>, key: string): string {
  return map.get(key) || '';
}

function getBoolProp(map: Map<string, string>, key: string): boolean {
  return map.get(key) === 'true';
}
