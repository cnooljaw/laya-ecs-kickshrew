/**
 * ComboViewBinding — ComboComponent → ComboNode 绑定
 */
import { ComboComponent } from "../ecs/components";
import { BIT_COMBO_COUNT, BIT_COMBO_TARGETS } from "./DirtyFlags";
import type { BindingFn } from "./SyncView";

export interface IComboNode {
  showCombo(count: number, targets: number[]): void;
  hideCombo(): void;
}

const comboNodeMap = new Map<number, IComboNode>();

export function registerComboNode(eid: number, node: IComboNode): void { comboNodeMap.set(eid, node); }
export function unregisterComboNode(eid: number): void { comboNodeMap.delete(eid); }

export const comboViewBinding: BindingFn = (eid: number, dirtyBits: number, forceFull: boolean) => {
  const node = comboNodeMap.get(eid);
  if (!node) return;

  if (forceFull || (dirtyBits & BIT_COMBO_COUNT) || (dirtyBits & BIT_COMBO_TARGETS)) {
    const count = ComboComponent.comboCount[eid];
    if (count > 0) {
      const targets = [
        ComboComponent.targetHole0[eid],
        ComboComponent.targetHole1[eid],
        ComboComponent.targetHole2[eid],
      ].filter(t => t > 0);
      node.showCombo(count, targets);
    } else {
      node.hideCombo();
    }
  }
};
