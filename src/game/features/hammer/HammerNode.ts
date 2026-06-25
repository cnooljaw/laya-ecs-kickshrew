/**
 * HammerNode — 光标锤子 + 击打特效
 *
 * Laya 实现：锤子中心点对齐点击点，避免点击位置与锤子视觉中心错位。
 */
import { clearTweens, destroyNode } from "../../../framework/view/LayaLifecycle";
import { loadResource } from "../../../framework/view/LayaLoader";
import { getLaya } from "../../../framework/view/LayaRuntime";
import { getAtlasPath, getFrameTexture } from "../../../resource/AtlasConfig";
import { HAMMER_VIEW_CONFIG } from "./HammerViewConfig";
import type { IHammerNode } from "./HammerViewContract";

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
    const Laya = getLaya();
    if (Laya) {
      this._sprite = new Laya.Sprite();
      this._sprite.name = "HammerNode";
      this._sprite.zOrder = HAMMER_VIEW_CONFIG.zOrder;
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

    const Laya = getLaya();
    if (!Laya) return;

    const atlasPath = getAtlasPath(HAMMER_ATLAS_NAME);
    const atlasUrl = `resources/${atlasPath}.atlas`;

    loadResource(atlasUrl, Laya.Loader.ATLAS).then((atlasRes: any) => {
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
    const Laya = getLaya();
    if (Laya) {
      const swing = HAMMER_VIEW_CONFIG.hitSwingDeg;
      const duration = HAMMER_VIEW_CONFIG.hitTweenMs;
      clearTweens(this._sprite);
      // 锤子击打动画: 正向摆动 → 反向摆动 → 复位
      Laya.Tween.to(this._sprite, { rotation: this._baseRotation + swing }, duration);
      Laya.Tween.to(this._sprite, { rotation: this._baseRotation - swing }, duration, null, Laya.Handler.create(this, () => {
        Laya.Tween.to(this._sprite, { rotation: this._baseRotation }, duration);
      }), HAMMER_VIEW_CONFIG.hitSecondTweenDelayMs);
    }
  }

  followTouch(x: number, y: number): void {
    if (this._sprite) {
      this._sprite.pos(x, y);
      this._sprite.zOrder = HAMMER_VIEW_CONFIG.zOrder;
      if (this._parent) {
        this._parent.setChildIndex?.(this._sprite, this._parent.numChildren - 1);
      }
    }
  }

  destroy(): void {
    if (this._sprite) {
      clearTweens(this._sprite);
      destroyNode(this._sprite);
      this._sprite = null;
    }
    this._parent = null;
  }
}
