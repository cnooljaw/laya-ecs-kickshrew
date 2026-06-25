/**
 * HitEffectNode — 击中特效节点（金币/宝箱/未命中）
 */
import { destroyNode } from "../../../framework/view/LayaLifecycle";
import { getLaya } from "../../../framework/view/LayaRuntime";
import { HIT_EFFECT_VIEW_CONFIG } from "./PlayerHudViewConfig";

export class HitEffectNode {
  private _container: any = null;

  create(parent: any): void {
    const Laya = getLaya();
    if (Laya) {
      this._container = new Laya.Sprite();
      this._container.name = "HitEffectNode";
      this._container.zOrder = HIT_EFFECT_VIEW_CONFIG.zOrder;
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
      destroyNode(this._container);
      this._container = null;
    }
  }
}
