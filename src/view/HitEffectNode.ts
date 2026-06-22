/**
 * HitEffectNode — 击中特效节点（金币/宝箱/未命中）
 */
import type { IHitEffectNode } from "../sync/contracts/HitViewContract";
import { HIT_EFFECT_VIEW_LAYOUT } from "../config/ViewLayoutConfig";

export class HitEffectNode implements IHitEffectNode {
  private _container: any = null;

  create(parent: any): void {
    const Laya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
    if (Laya) {
      this._container = new Laya.Sprite();
      this._container.name = "HitEffectNode";
      this._container.zOrder = HIT_EFFECT_VIEW_LAYOUT.zOrder;
      if (parent) {
        parent.addChild(this._container);
        parent.setChildIndex?.(this._container, parent.numChildren - 1);
      }
    }
  }

  showReward(shrewIndex: number, reward: number): void {
    // TODO: 播放金币飘字动画
    // 根据 reward 值创建 Laya.Text 或 Laya.Animation
  }

  showMiss(): void {
    // TODO: 播放未命中特效（如灰尘）
  }

  destroy(): void {
    if (this._container) {
      this._container.destroy();
      this._container = null;
    }
  }
}
