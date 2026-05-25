/**
 * AtlasConfig — atlas 逻辑名 → 文件路径映射表
 *
 * 所有 atlas 文件由 PlistConverter 从 plist 转换生成，
 * 存放在 assets/resources/kickshrew/ 目录下。
 * Laya 加载时使用 "kickshrew/xxx" 相对路径（不含扩展名）。
 */

/** atlas 逻辑名到 Laya 加载路径的映射 */
export const ATLAS_MAP: Record<string, string> = {
  // ---- 地鼠 ----
  shrew_red: "kickshrew/kickshrew_role_red",
  shrew_boss: "kickshrew/kickshrew_role_boss",
  shrew_yellow: "kickshrew/kickshrew_role_yellow",
  shrew_green: "kickshrew/kickshrew_role_second",

  // ---- 帽子 ----
  boss_hat: "kickshrew/kickshrew_boss_hat",

  // ---- 眩晕星星 ----
  dizzy_star: "kickshrew/shrew_dizzy_star",

  // ---- 游戏通用 UI ----
  game_view: "kickshrew/kickshrew_game_view",

  // ---- 连击闪电 ----
  combo_lightning: "kickshrew/kickshrew_combo_lighting",

  // ---- 锤子特效 ----
  hammer_effect: "kickshrew/kickshrew_hammer_effect",
  angry_hammer_effect: "kickshrew/kickshrew_angry_hammer_effect",

  // ---- 宝箱 ----
  treasure_box: "kickshrew/kickshrew_treasure_box",
  treasure_effect: "kickshrew/kickshrew_treasue_effect",

  // ---- 场景 ----
  scene_grass: "kickshrew/game_view_grass",
  scene_grassbg: "kickshrew/game_view_grassbg",
  scene_corsair: "kickshrew/kickshrew_game_view_corsair",
  scene_corsairbg: "kickshrew/kickshrew_game_view_corsairbg",
  scene_sewer: "kickshrew/kickshrew_game_view_sewer",
  scene_sewerbg_01: "kickshrew/kickshrew_game_view_sewerbg_01",
  scene_sewerbg_02: "kickshrew/kickshrew_game_view_sewerbg_02",
  scene_moon: "kickshrew/kickshrew_game_view_moon",
  scene_moonbg: "kickshrew/kickshrew_game_view_moonbg",

  // ---- 表情动画 ----
  swear_animation: "kickshrew/kickshrew_swear_animation",

  // ---- 抽屉(洞口蒙版) ----
  drawer: "kickshrew/kickshrew_game_view_drawer",

  // ---- 游戏结束 / 倒计时 / 开始框 ----
  gameOverBox: "kickshrew/kickshrew_gameOverBox",
  countdownBox: "kickshrew/kickshrew_challengeMatch_countdownBox",
  beginBox: "kickshrew/kickshrew_challengeMatch_beginBox",

  // ---- 房间视图 (暂不用) ----
  room_view: "kickshrew/kickshrew_room_view",
};

/** 获取所有需要预加载的 atlas 路径列表 */
export function getAllAtlasPaths(): string[] {
  return Object.values(ATLAS_MAP);
}

/** 根据逻辑名获取 Laya 加载路径 */
export function getAtlasPath(logicalName: string): string {
  const path = ATLAS_MAP[logicalName];
  if (!path) throw new Error(`Unknown atlas logical name: ${logicalName}`);
  return path;
}

/**
 * 从 AtlasResource 的 frames 数组中按帧名查找 Texture。
 *
 * 背景：Laya 3.x AtlasLoader 将子帧存入 AtlasResource.frames（Texture[]），
 * 每帧的 url 形如 "resources/kickshrew/kickshrew_role_red/red_body"。
 * 由于帧 url 无文件扩展名，cacheRes 无法推断 typeId，帧不会写入
 * Loader.loadedMap，所以 Loader.getRes(frameUrl) 始终返回 null。
 * 正确做法：直接遍历 atlasRes.frames，按 url 后缀匹配帧名取 Texture。
 *
 * @param atlasRes  Laya.loader.load(url, Laya.Loader.ATLAS) 返回的 AtlasResource
 * @param frameName 帧名，如 "red_body"（不含目录前缀）
 * @returns 对应的 Texture，未找到时返回 null
 */
export function getFrameTexture(atlasRes: any, frameName: string): any {
  if (!atlasRes || !atlasRes.frames) return null;
  const frames: any[] = atlasRes.frames;
  // atlasRes.frames 是 Texture[]，每个帧的 url 以 "/frameName" 结尾
  const suffix = "/" + frameName;
  return frames.find((t: any) => t && t.url && t.url.endsWith(suffix)) || null;
}
