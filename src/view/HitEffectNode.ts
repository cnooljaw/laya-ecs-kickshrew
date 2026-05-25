/**
 * HitEffectNode — 击中特效节点（金币/宝箱/未命中）
 */
import type { IHitEffectNode } from "../binding/HitViewBinding";

export class HitEffectNode implements IHitEffectNode {
  private _container: any = null;

  create(parent: any): void {
    const Laya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
    if (Laya) {
      this._container = new Laya.Sprite();
      this._container.name = "HitEffectNode";
      if (parent) {
        parent.addChild(this._container);
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
