/**
 * HitViewBinding — HitComponent → 金币/宝箱动画绑定
 */
import type { BindingFn } from "./SyncView";
import { applyMatchedRules } from "../sync/rules/ViewBindingRule";
import { HIT_VIEW_RULES } from "../sync/rules/HitViewRules";

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

  applyMatchedRules(HIT_VIEW_RULES, { eid, node, dirtyBits, forceFull });
};
