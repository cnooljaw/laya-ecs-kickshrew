/**
 * ComboViewBinding — ComboComponent → ComboNode 绑定
 */
import type { BindingFn } from "./SyncView";
import { applyMatchedRules } from "../sync/rules/ViewBindingRule";
import { COMBO_VIEW_RULES } from "../sync/rules/ComboViewRules";

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

  applyMatchedRules(COMBO_VIEW_RULES, { eid, node, dirtyBits, forceFull });
};
