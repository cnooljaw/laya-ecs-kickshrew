/**
 * HammerViewBinding — HammerComponent → HammerNode 绑定
 */
import type { BindingFn } from "./SyncView";
import { applyMatchedRules } from "./rules/ViewBindingRule";
import { HAMMER_VIEW_RULES } from "./rules/HammerViewRules";

export interface IHammerNode {
  setHammerType(hammerType: number): void;
  setThunderActive(active: boolean): void;
  playHitAnimation(): void;
}

const hammerNodeMap = new Map<number, IHammerNode>();

export function registerHammerNode(eid: number, node: IHammerNode): void { hammerNodeMap.set(eid, node); }
export function unregisterHammerNode(eid: number): void { hammerNodeMap.delete(eid); }

export const hammerViewBinding: BindingFn = (eid: number, dirtyBits: number, forceFull: boolean) => {
  const node = hammerNodeMap.get(eid);
  if (!node) return;

  applyMatchedRules(HAMMER_VIEW_RULES, { eid, node, dirtyBits, forceFull });
};
