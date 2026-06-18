/**
 * HoleViewBinding — HoleComponent → HoleNode 绑定
 */
import type { BindingFn } from "./SyncView";
import { applyMatchedRules } from "./rules/ViewBindingRule";
import { HOLE_VIEW_RULES } from "./rules/HoleViewRules";

export interface IHoleNode {
  setPosition(xRatio: number, yRatio: number): void;
  setShrewVisible(shrewEid: number): void;
  setZOrder(z: number): void;
}

const holeNodeMap = new Map<number, IHoleNode>();

export function registerHoleNode(eid: number, node: IHoleNode): void { holeNodeMap.set(eid, node); }
export function unregisterHoleNode(eid: number): void { holeNodeMap.delete(eid); }

export const holeViewBinding: BindingFn = (eid: number, dirtyBits: number, forceFull: boolean) => {
  const node = holeNodeMap.get(eid);
  if (!node) return;

  applyMatchedRules(HOLE_VIEW_RULES, { eid, node, dirtyBits, forceFull });
};
