/**
 * SceneLayer — 背景层 + cover遮罩层
 *
 * 场景结构（参考各 GameViewXxx.lua）：
 * - 背景图铺满屏幕
 * - cover1/2/3 是叠在背景上的前景遮罩，形成洞口视觉效果
 *   Cocos 中从下往上：cover1(y=0) → cover2(y=h1) → cover3(y=h1+h2)
 *   Laya Y-down 转换：cover3 在顶部，cover1 在底部
 *   cover1 y = H - h1，cover2 y = H - h1 - h2，cover3 y = H - h1 - h2 - h3
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
import type { ISceneLayer } from "../sync/contracts/SceneViewContract";
import { MapType } from "../ecs/types";
import { getAtlasPath, getFrameTexture } from "../resource/AtlasConfig";
import { SCENE_LAYOUT, VIEWPORT } from "../config/ViewLayoutConfig";

/** 地图类型 → 背景 atlas 逻辑名 */
const MAP_BG_ATLAS: Record<number, string> = {
  [MapType.Meadow]: "scene_grassbg",
  [MapType.Ship]:   "scene_corsairbg",
  [MapType.Space]:  "scene_moonbg",
};

/** 地图类型 → atlas 中的背景帧名 */
const MAP_BG_FRAME: Record<number, string> = {
  [MapType.Meadow]: "shrew_grass_bg",
  [MapType.Ship]:   "corsair_bg03",
  [MapType.Space]:  "moon_bg02",
};

/** 地图类型 → 前景 cover atlas 逻辑名 */
const MAP_COVER_ATLAS: Record<number, string> = {
  [MapType.Meadow]: "scene_grass",
  [MapType.Ship]:   "scene_corsair",
  [MapType.Space]:  "scene_moon",
};

/**
 * 各场景 cover 帧配置
 * frames[0] = 底部行遮罩（Cocos cover1，zOrder=7）
 * frames[1] = 中间行遮罩（Cocos cover2，zOrder=5）
 * frames[2] = 顶部行遮罩（Cocos cover3，zOrder=3）
 *
 * 参考各 GameViewXxx.lua setScene() 函数：
 *   草地:  cover1=grass_cover_1, cover2=grass_cover_2, cover3=grass_cover_3
 *   帆船:  cover1=corsair_3, cover2=corsair_2, cover3=corsair_1
 *   太空:  cover1=moon_1, cover2=moon_2, cover3=moon_3
 */
interface CoverConfig {
  frames: string[];   // 从底到顶：[cover1_frameName, cover2_frameName, cover3_frameName]
  zOrders: number[];  // 对应 zOrder
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
  [MapType.Space]: {
    frames:  ["moon_1", "moon_2", "moon_3"],
    zOrders: [7, 5, 3],
  },
};

export class SceneLayer implements ISceneLayer {
  private _parent: any = null;
  private _bgSprite: any = null;
  private _coverSprites: any[] = [];
  private _transitionMasks: any[] = [];
  private _currentMap: number = -1;

  create(parent: any): void {
    const Laya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
    if (Laya) {
      this._parent = parent;

      // 背景精灵直接加到 parent（_root），保证在最底层
      this._bgSprite = new Laya.Sprite();
      this._bgSprite.name = "BgSprite";
      this._bgSprite.zOrder = SCENE_LAYOUT.backgroundZOrder;
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
      this._bgSprite.graphics.drawTexture(tex, 0, 0, VIEWPORT.width, VIEWPORT.height);
    });
  }

  private _loadCovers(Laya: any, mapType: number): void {
    const coverCfg = MAP_COVER_CONFIG[mapType];
    const coverAtlasName = MAP_COVER_ATLAS[mapType];
    if (!coverCfg || !coverAtlasName) return;

    const atlasPath = getAtlasPath(coverAtlasName);
    const atlasUrl = `resources/${atlasPath}.atlas`;

    Laya.loader.load(atlasUrl, Laya.Loader.ATLAS).then((atlasRes: any) => {
      if (!this._parent || this._currentMap !== mapType) return;
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

      // 底部堆叠布局
      const h1 = tex1 ? tex1.height : 0;
      const h2 = tex2 ? tex2.height : 0;
      const h3 = tex3 ? tex3.height : 0;

      const coverData = [
        { tex: tex1, y: VIEWPORT.height - h1,           h: h1, z: coverCfg.zOrders[0] },
        { tex: tex2, y: VIEWPORT.height - h1 - h2,      h: h2, z: coverCfg.zOrders[1] },
        { tex: tex3, y: VIEWPORT.height - h1 - h2 - h3, h: h3, z: coverCfg.zOrders[2] },
      ];

      for (const { tex, y, h, z } of coverData) {
        if (!tex) continue;
        const sp = new Laya.Sprite();
        sp.zOrder = z;
        sp.graphics.drawTexture(tex, 0, 0, VIEWPORT.width, h);
        sp.y = y;
        this._parent.addChild(sp);
        this._coverSprites.push(sp);
      }
    });
  }

  private _clearCovers(Laya: any): void {
    for (const sp of this._coverSprites) {
      if (sp) {
        Laya.timer?.clearAll?.(sp);
        Laya.Tween?.clearAll?.(sp);
        sp.destroy();
      }
    }
    this._coverSprites = [];
  }

  setTransitioning(transitioning: boolean): void {
    if (transitioning && this._parent) {
      const Laya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
      if (Laya) {
        const mask = new Laya.Sprite();
        mask.graphics.drawRect(0, 0, VIEWPORT.width, VIEWPORT.height, SCENE_LAYOUT.transitionMaskColor);
        mask.alpha = 0;
        mask.zOrder = SCENE_LAYOUT.transitionMaskZOrder;
        this._parent.addChild(mask);
        this._transitionMasks.push(mask);
        Laya.Tween.to(mask, { alpha: 1 }, SCENE_LAYOUT.transitionFadeInMs).then(() => {
          Laya.Tween.to(mask, { alpha: 0 }, SCENE_LAYOUT.transitionFadeOutMs).then(() => {
            this._removeTransitionMask(mask);
            mask.destroy();
          });
        });
      }
    }
  }

  destroy(): void {
    const Laya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
    if (Laya) this._clearCovers(Laya);
    this._clearTransitionMasks(Laya);
    if (this._bgSprite) {
      this._bgSprite.destroy();
      this._bgSprite = null;
    }
    this._parent = null;
  }

  private _clearTransitionMasks(Laya: any): void {
    for (const mask of this._transitionMasks) {
      if (!mask) continue;
      Laya?.timer?.clearAll?.(mask);
      Laya?.Tween?.clearAll?.(mask);
      mask.destroy();
    }
    this._transitionMasks = [];
  }

  private _removeTransitionMask(mask: any): void {
    const index = this._transitionMasks.indexOf(mask);
    if (index >= 0) this._transitionMasks.splice(index, 1);
  }
}
