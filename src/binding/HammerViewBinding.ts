/**
 * HammerViewBinding — HammerComponent → HammerNode 绑定
 */
import type { BindingFn } from "./SyncView";
import { createRuleBinding, createViewNodeRegistry } from "./RuleViewBinding";
import { HAMMER_VIEW_RULES } from "../sync/rules/HammerViewRules";
import type { IHammerNode } from "../sync/contracts/HammerViewContract";

const hammerRegistry = createViewNodeRegistry<IHammerNode>();

export const registerHammerNode = hammerRegistry.register;
export const unregisterHammerNode = hammerRegistry.unregister;
export const hammerViewBinding: BindingFn = createRuleBinding(hammerRegistry, HAMMER_VIEW_RULES);
