/**
 * SceneLayer — 背景层 + cover遮罩层 + 装饰物
 *
 * 场景结构（参考各 GameViewXxx.lua）：
 * - 背景图铺满屏幕
 * - cover1/2/3 是叠在背景上的前景遮罩，形成洞口视觉效果
 *   Cocos 中从下往上：cover1(y=0) → cover2(y=h1) → cover3(y=h1+h2)
 *   Laya Y-down 转换：cover3 在顶部，cover1 在底部
 *   cover3.y = H - h3 - h2 - h1（实际从下计算）
 *   简化：cover1 y = H - h1，cover2 y = H - h1 - h2，cover3 y = H - h1 - h2 - h3
 *
 * ZOrder（cover 要盖在地鼠上方）：
 *   背景 zOrder=-100，cover 各行夹在洞位行之间
 *   行0洞 zOrder=2，cover1 zOrder=3（盖住行0），cover2 zOrder=5（盖住行1），cover3 zOrder=7（盖住行2）
 *
 * Cover 高度说明：
 *   Cocos 中 cover 以原始分辨率（1136px宽）显示，高度为自然值（未缩放）。
 *   Laya 中将 cover 压缩到 960px 宽度，但高度必须保持自然值，
 *   否则 cover 过短无法正确遮挡洞口区域。
 */
import type { ISceneLayer } from "../binding/SceneViewBinding";
import { MapType } from "../ecs/types";
import { getAtlasPath, getFrameTexture } from "../resource/AtlasConfig";

/** 设计分辨率（横版）*/
const W = 960;
const H = 640;

/** 地图类型 → 背景 atlas 逻辑名 */
const MAP_BG_ATLAS: Record<number, string> = {
  [MapType.Meadow]: "scene_grassbg",
  [MapType.Ship]:   "scene_corsairbg",
  [MapType.Sewer]:  "scene_sewerbg_01",
  [MapType.Space]:  "scene_moonbg",
};

/** 地图类型 → atlas 中的背景帧名 */
const MAP_BG_FRAME: Record<number, string> = {
  [MapType.Meadow]: "shrew_grass_bg",
  [MapType.Ship]:   "corsair_bg03",
  [MapType.Sewer]:  "sewer_viewBg",
  [MapType.Space]:  "moon_bg02",
};

/** 地图类型 → 前景 cover atlas 逻辑名 */
const MAP_COVER_ATLAS: Record<number, string> = {
  [MapType.Meadow]: "scene_grass",
  [MapType.Ship]:   "scene_corsair",
  [MapType.Sewer]:  "scene_sewer",
  [MapType.Space]:  "scene_moon",
};

/**
 * 各场景 cover 帧配置
 * frames[0] = 底部行遮罩（Cocos cover1，Lua setPosition y=0，zOrder=7）
 * frames[1] = 中间行遮罩（Cocos cover2，Lua setPosition y=h1，zOrder=5）
 * frames[2] = 顶部行遮罩（Cocos cover3，Lua setPosition y=h1+h2，zOrder=3）
 *
 * Cocos Y-up → Laya Y-down 转换（设计分辨率 H=640）：
 *   cover1 在 Cocos 底部（y=0）    → Laya y = H - h1，    zOrder=7
 *   cover2 在 Cocos 中部（y=h1）   → Laya y = H - h1 - h2，zOrder=5
 *   cover3 在 Cocos 顶部（y=h1+h2）→ Laya y = H - h1 - h2 - h3，zOrder=3
 *
 * 参考各 GameViewXxx.lua setScene() 函数：
 *   草地:  cover1=grass_cover_1(h=151), cover2=grass_cover_2(h=133), cover3=grass_cover_3(h=118)
 *   帆船:  cover1=corsair_3(h=144),     cover2=corsair_2(h=132),     cover3=corsair_1(h=118)
 *   下水道: 中心定位（非底部堆叠），单独处理，用各行中心 y 坐标
 *   太空:  cover1=moon_1(h=147),        cover2=moon_2(h=133),        cover3=moon_3(h=116)
 */
interface CoverConfig {
  frames: string[];   // 从底到顶：[cover1_frameName, cover2_frameName, cover3_frameName]
  zOrders: number[];  // 对应 zOrder
  sewerCenter?: boolean; // 下水道特殊：按中心坐标定位而非底部堆叠
  centerYRatios?: number[]; // 各 cover 中心 y 比例（Cocos Y-up，需转换）
}

/** 下水道叠加层 cover（在 hole 上方，真正遮挡地鼠的前景遮罩）
 *  overlay 帧是 trimmed 的（顶部被裁剪），定位需用 sourceSize 中心 + trimTopY 偏移：
 *    sp.y = H * (1 - centerYRatio) - sourceH/2 + trimTopY
 */
interface SewerOverlayConfig {
  frames: string[];
  zOrders: number[];
  centerYRatios: number[];
  sourceHeights: number[];   // sourceSize.h（Cocos 定位基于 sourceSize 中心）
  trimTopYs: number[];       // spriteSourceSize.y（顶部裁剪像素数）
}

const MAP_COVER_CONFIG: Record<number, CoverConfig> = {
  [MapType.Meadow]: {
    frames:  ["grass_cover_1", "grass_cover_2", "grass_cover_3"],
    zOrders: [7, 5, 3],
  },
  [MapType.Ship]: {
    frames:  ["corsair_3", "corsair_2", "corsair_1"],
    zOrders: [7, 5, 3],
  },
  [MapType.Sewer]: {
    // 下水道基础 cover（在 hole 下方，作为行背景）
    // Cocos: sewer_1(z=2), sewer_2(z=6), sewer_3(z=10)
    frames:  ["sewer_1", "sewer_2", "sewer_3"],
    zOrders: [2, 6, 10],
    sewerCenter: true,
    centerYRatios: [0.55, 0.378, 0.14],
  },
  [MapType.Space]: {
    frames:  ["moon_1", "moon_2", "moon_3"],
    zOrders: [7, 5, 3],
  },
};

/** 下水道叠加层 cover（在 hole 上方，真正遮挡地鼠）
 *  Cocos: sewer_1_1(z=4), sewer_2_1(z=8), sewer_3_1(z=12)
 *  洞位 zOrder: 底行=3, 中行=7, 顶行=11
 *  渲染顺序: base_cover(z=2) < hole(z=3) < overlay(z=4) → 三明治结构
 */
const SEWER_OVERLAY: SewerOverlayConfig = {
  frames:  ["sewer_1_1", "sewer_2_1", "sewer_3_1"],
  zOrders: [4, 8, 12],
  centerYRatios: [0.58, 0.38, 0.14],
  sourceHeights: [115, 134, 180],  // sourceSize.h (trimmed 前的原始高度)
  trimTopYs: [28, 32, 32],         // spriteSourceSize.y (顶部裁剪像素)
};

export class SceneLayer implements ISceneLayer {
  private _parent: any = null;
  private _bgSprite: any = null;
  private _coverSprites: any[] = [];
  private _currentMap: number = -1;

  create(parent: any): void {
    const Laya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
    if (Laya) {
      this._parent = parent;

      // 背景精灵直接加到 parent（_root），zOrder=-100 保证在最底层
      this._bgSprite = new Laya.Sprite();
      this._bgSprite.name = "BgSprite";
      this._bgSprite.zOrder = -100;
      if (parent) parent.addChild(this._bgSprite);
    }
  }

  switchScene(mapType: number): void {
    if (this._currentMap === mapType) return;
    this._currentMap = mapType;

    const Laya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
    if (!Laya || !this._bgSprite) return;

    // 清除旧 cover
    this._clearCovers(Laya);

    // 加载背景
    this._loadBackground(Laya, mapType);

    // 加载 cover 遮罩层
    this._loadCovers(Laya, mapType);
  }

  private _loadBackground(Laya: any, mapType: number): void {
    const atlasName = MAP_BG_ATLAS[mapType];
    const frameName = MAP_BG_FRAME[mapType];
    if (!atlasName || !frameName) return;

    const atlasPath = getAtlasPath(atlasName);
    const atlasUrl = `resources/${atlasPath}.atlas`;

    Laya.loader.load(atlasUrl, Laya.Loader.ATLAS).then((atlasRes: any) => {
      if (!this._bgSprite) return;
      if (!atlasRes) {
        console.error(`[SceneLayer] bg atlas load failed: ${atlasUrl}`);
        return;
      }
      const tex = getFrameTexture(atlasRes, frameName);
      if (!tex) {
        console.error(`[SceneLayer] bg frame not found: "${frameName}" in ${atlasUrl}`,
          '\nAvailable:', atlasRes.frames?.map((f: any) => f?.url));
        return;
      }
      this._bgSprite.graphics.clear();
      // 背景：拉伸到屏幕尺寸（trimmed 帧的空白区域由独立精灵覆盖，如船场景的天空）
      this._bgSprite.graphics.drawTexture(tex, 0, 0, W, H);
    });
  }

  private _loadCovers(Laya: any, mapType: number): void {
    const coverCfg = MAP_COVER_CONFIG[mapType];
    const coverAtlasName = MAP_COVER_ATLAS[mapType];
    if (!coverCfg || !coverAtlasName) return;

    const atlasPath = getAtlasPath(coverAtlasName);
    const atlasUrl = `resources/${atlasPath}.atlas`;

    Laya.loader.load(atlasUrl, Laya.Loader.ATLAS).then((atlasRes: any) => {
      if (!this._parent) return;
      if (!atlasRes) {
        console.error(`[SceneLayer] cover atlas load failed: ${atlasUrl}`);
        return;
      }

      // 获取三张 cover 纹理：frames[0]=底部cover1, frames[1]=中cover2, frames[2]=顶部cover3
      const textures = coverCfg.frames.map((name: string) => getFrameTexture(atlasRes, name));
      const [tex1, tex2, tex3] = textures;

      if (!tex1 && !tex2 && !tex3) {
        console.error(`[SceneLayer] no cover textures found for mapType=${mapType}`);
        return;
      }

      this._clearCovers(Laya);

      // 下水道场景：中心坐标定位
      // Cocos 中 cover 以原始分辨率显示，高度为自然值（未缩放）
      if (coverCfg.sewerCenter && coverCfg.centerYRatios) {
        const covers = [tex1, tex2, tex3];
        for (let i = 0; i < covers.length; i++) {
          const tex = covers[i];
          if (!tex) continue;
          const h = tex.height;
          const layaY = H * (1 - coverCfg.centerYRatios[i]) - h / 2;
          const sp = new Laya.Sprite();
          sp.zOrder = coverCfg.zOrders[i];
          sp.graphics.drawTexture(tex, 0, 0, W, h);
          sp.y = layaY;
          this._parent.addChild(sp);
          this._coverSprites.push(sp);
        }
        // 渲染 overlay 遮罩（在 hole 上方，真正遮挡地鼠）
        // overlay 帧是 trimmed 的，定位基于 sourceSize 中心而非 frame 中心
        for (let i = 0; i < SEWER_OVERLAY.frames.length; i++) {
          const overlayTex = getFrameTexture(atlasRes, SEWER_OVERLAY.frames[i]);
          if (!overlayTex) continue;
          const frameH = overlayTex.height;
          const sourceH = SEWER_OVERLAY.sourceHeights[i];
          const trimTop = SEWER_OVERLAY.trimTopYs[i];
          const olayaY = H * (1 - SEWER_OVERLAY.centerYRatios[i]) - sourceH / 2 + trimTop;
          const osp = new Laya.Sprite();
          osp.zOrder = SEWER_OVERLAY.zOrders[i];
          osp.graphics.drawTexture(overlayTex, 0, 0, W, frameH);
          osp.y = olayaY;
          this._parent.addChild(osp);
          this._coverSprites.push(osp);
        }
        return;
      }

      // 普通场景（草地/帆船/太空）：底部堆叠布局
      // Cocos 中 cover 以原始分辨率（1136px宽）显示，高度为自然高度（未缩放）。
      // Laya 中将 cover 压缩到 960px 宽度，但高度必须保持自然值，
      // 否则 cover 过短，无法正确遮挡洞口区域。
      const h1 = tex1 ? tex1.height : 0;
      const h2 = tex2 ? tex2.height : 0;
      const h3 = tex3 ? tex3.height : 0;

      const coverData = [
        { tex: tex1, y: H - h1,           h: h1, z: coverCfg.zOrders[0] },
        { tex: tex2, y: H - h1 - h2,      h: h2, z: coverCfg.zOrders[1] },
        { tex: tex3, y: H - h1 - h2 - h3, h: h3, z: coverCfg.zOrders[2] },
      ];

      for (const { tex, y, h, z } of coverData) {
        if (!tex) continue;
        const sp = new Laya.Sprite();
        sp.zOrder = z;
        sp.graphics.drawTexture(tex, 0, 0, W, h);
        sp.y = y;
        this._parent.addChild(sp);
        this._coverSprites.push(sp);
      }
    });
  }

  private _clearCovers(Laya: any): void {
    for (const sp of this._coverSprites) {
      if (sp) sp.destroy();
    }
    this._coverSprites = [];
  }

  setTransitioning(transitioning: boolean): void {
    if (transitioning && this._parent) {
      const Laya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
      if (Laya) {
        const mask = new Laya.Sprite();
        mask.graphics.drawRect(0, 0, W, H, "#FFFFFF");
        mask.alpha = 0;
        mask.zOrder = 999;
        this._parent.addChild(mask);
        Laya.Tween.to(mask, { alpha: 1 }, 300).then(() => {
          Laya.Tween.to(mask, { alpha: 0 }, 300).then(() => {
            mask.destroy();
          });
        });
      }
    }
  }

  destroy(): void {
    const Laya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
    if (Laya) this._clearCovers(Laya);
    if (this._bgSprite) {
      this._bgSprite.destroy();
      this._bgSprite = null;
    }
    this._parent = null;
  }
}
