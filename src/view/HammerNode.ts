/**
 * HammerNode — 光标锤子 + 击打特效
 *
 * Laya 实现：锤子中心点对齐点击点，避免点击位置与锤子视觉中心错位。
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
  private _parent: any = null;
  private _currentHammerType: number = -1;
  private _baseRotation: number = 0;

  create(parent: any): void {
    const Laya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
    if (Laya) {
      this._sprite = new Laya.Sprite();
      this._sprite.name = "HammerNode";
      this._sprite.zOrder = 10000;
      this._parent = parent;
      if (parent) {
        parent.addChild(this._sprite);
        parent.setChildIndex?.(this._sprite, parent.numChildren - 1);
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
        this._baseRotation = isRotated ? -90 : 0;
        this._sprite.rotation = this._baseRotation;

        this._sprite.graphics.drawTexture(tex, -tex.width * 0.5, -tex.height * 0.5, tex.width, tex.height);
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
      Laya.Tween.to(this._sprite, { rotation: this._baseRotation + 30 }, 80);
      Laya.Tween.to(this._sprite, { rotation: this._baseRotation - 30 }, 80, null, Laya.Handler.create(this, () => {
        Laya.Tween.to(this._sprite, { rotation: this._baseRotation }, 80);
      }), 80);
    }
  }

  followTouch(x: number, y: number): void {
    if (this._sprite) {
      this._sprite.pos(x, y);
      this._sprite.zOrder = 10000;
      if (this._parent) {
        this._parent.setChildIndex?.(this._sprite, this._parent.numChildren - 1);
      }
    }
  }

  destroy(): void {
    if (this._sprite) {
      this._sprite.destroy();
      this._sprite = null;
    }
    this._parent = null;
  }
}
