/**
 * HitViewBinding — HitComponent → 金币/宝箱动画绑定
 */
import { HitComponent } from "../ecs/components";
import { BIT_HIT_INDEX, BIT_HIT_REWARD, BIT_HIT_WASHIT } from "./DirtyFlags";
import type { BindingFn } from "./SyncView";

export interface IHitEffectNode {
  showReward(shrewIndex: number, reward: number): void;
  showMiss(): void;
}

const hitNodeMap = new Map<number, IHitEffectNode>();

export function registerHitEffectNode(eid: number, node: IHitEffectNode): void { hitNodeMap.set(eid, node); }
export function unregisterHitEffectNode(eid: number): void { hitNodeMap.delete(eid); }

export const hitViewBinding: BindingFn = (eid: number, dirtyBits: number, forceFull: boolean) => {
  const node = hitNodeMap.get(eid);
  if (!node) return;

  if (forceFull || (dirtyBits & BIT_HIT_INDEX) || (dirtyBits & BIT_HIT_REWARD) || (dirtyBits & BIT_HIT_WASHIT)) {
    if (HitComponent.wasHit[eid] === 1) {
      node.showReward(HitComponent.shrewIndex[eid], HitComponent.reward[eid]);
    } else {
      node.showMiss();
    }
  }
};
