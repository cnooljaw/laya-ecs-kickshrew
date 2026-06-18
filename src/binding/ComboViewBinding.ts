/**
 * ComboViewBinding — ComboComponent → ComboNode 绑定
 */
import type { BindingFn } from "./SyncView";
import { createRuleBinding, createViewNodeRegistry } from "./RuleViewBinding";
import { COMBO_VIEW_RULES } from "../sync/rules/ComboViewRules";

export interface IComboNode {
  showCombo(count: number, targets: number[]): void;
  hideCombo(): void;
}

const comboRegistry = createViewNodeRegistry<IComboNode>();

export const registerComboNode = comboRegistry.register;
export const unregisterComboNode = comboRegistry.unregister;
export const comboViewBinding: BindingFn = createRuleBinding(comboRegistry, COMBO_VIEW_RULES);
