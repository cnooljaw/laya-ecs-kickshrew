/**
 * HammerNode — 光标锤子 + 击打特效
 *
 * 参考原始 Cocos GameView.lua:
 *   锚点 (0.75, 0.15)：锤子握柄处在锚点附近
 *   位置: (touch.x + width*0.65, touch.y + height*0.15)
 *   综合效果：点击点在锤子图像底部 (0.1*w, 底部)，锤头向上延伸
 *
 * Laya 实现：drawTexture 偏移使图像点 (0.1*w, 底部) 对齐 Sprite 原点
 */
import type { IHammerNode } from "../binding/HammerViewBinding";
import { getAtlasPath, getFrameTexture } from "../resource/AtlasConfig";

/** 锤子类型 → atlas 中的帧名（game_view.atlas 内的大图锤子帧）*/
const HAMMER_FRAME_MAP: Record<number, string> = {
  1:  "hammer/hammer_big_1",
  2:  "hammer/hammer_big_2",
  3:  "hammer/hammer_big_3",
  4:  "hammer/hammer_big_4",
  5:  "hammer/hammer_big_5",
  6:  "hammer/hammer_big_6",
  99: "hammer/hammer_big_99",
};

/** 哪些锤子帧在 atlas 中是 rotated=true */
const HAMMER_ROTATED_FRAMES = new Set([
  "hammer/hammer_big_4",
  "hammer/hammer_small_4",
  "hammer/hammer_small_6",
  "hammer/hammer_99",
]);

/** 所有锤子帧都在 game_view atlas 中 */
const HAMMER_ATLAS_NAME = "game_view";

export class HammerNode implements IHammerNode {
  private _sprite: any = null;
  private _currentHammerType: number = -1;

  create(parent: any): void {
    const Laya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
    if (Laya) {
      this._sprite = new Laya.Sprite();
      this._sprite.name = "HammerNode";
      if (parent) {
        parent.addChild(this._sprite);
      }
    }
  }

  setHammerType(hammerType: number): void {
    if (this._currentHammerType === hammerType) return;
    this._currentHammerType = hammerType;
    if (!this._sprite) return;

    const frameName = HAMMER_FRAME_MAP[hammerType];
    if (!frameName) return;

    const Laya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
    if (!Laya) return;

    const atlasPath = getAtlasPath(HAMMER_ATLAS_NAME);
    const atlasUrl = `resources/${atlasPath}.atlas`;

    Laya.loader.load(atlasUrl, Laya.Loader.ATLAS).then((atlasRes: any) => {
      if (!this._sprite) return;
      const tex = getFrameTexture(atlasRes, frameName);
      if (tex) {
        this._sprite.graphics.clear();

        const isRotated = HAMMER_ROTATED_FRAMES.has(frameName);
        if (isRotated) {
          this._sprite.rotation = -90;
        } else {
          this._sprite.rotation = 0;
        }

        // 原始 Cocos: 锚点(0.75, 0.15)，位置偏移(+0.65w, +0.15h)
        // 综合效果: 点击点在图像 (0.1*w, 底部)
        // drawTexture 偏移: 让图像点 (0.1*w, h) 对齐原点(0,0)
        this._sprite.graphics.drawTexture(tex, -tex.width * 0.1, -tex.height, tex.width, tex.height);
      }
    });
  }

  setThunderActive(active: boolean): void {
    this.setHammerType(active ? 99 : 1);
  }

  playHitAnimation(): void {
    if (!this._sprite) return;
    const Laya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
    if (Laya) {
      // 锤子击打动画: 旋转 30°→-30°→0° (0.24秒)
      Laya.Tween.to(this._sprite, { rotation: 30 }, 80);
      Laya.Tween.to(this._sprite, { rotation: -30 }, 80, null, Laya.Handler.create(this, () => {
        Laya.Tween.to(this._sprite, { rotation: 0 }, 80);
      }), 80);
    }
  }

  followTouch(x: number, y: number): void {
    if (this._sprite) {
      this._sprite.pos(x, y);
    }
  }

  destroy(): void {
    if (this._sprite) {
      this._sprite.destroy();
      this._sprite = null;
    }
  }
}
