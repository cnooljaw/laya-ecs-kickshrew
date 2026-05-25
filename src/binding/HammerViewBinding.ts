/**
 * HammerViewBinding — HammerComponent → HammerNode 绑定
 */
import { HammerComponent } from "../ecs/components";
import { BIT_HAMMER_TYPE, BIT_HAMMER_THUNDER, BIT_HAMMER_HITTABLE } from "./DirtyFlags";
import type { BindingFn } from "./SyncView";

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

  if (forceFull || (dirtyBits & BIT_HAMMER_TYPE)) {
    node.setHammerType(HammerComponent.selectedType[eid]);
  }
  if (forceFull || (dirtyBits & BIT_HAMMER_THUNDER)) {
    node.setThunderActive(HammerComponent.isThunderActive[eid] === 1);
  }
};
