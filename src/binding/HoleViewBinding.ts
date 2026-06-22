/**
 * HoleViewBinding — HoleComponent → HoleNode 绑定
 */
import type { BindingFn } from "./SyncView";
import { createRuleBinding, createViewNodeRegistry } from "./RuleViewBinding";
import { HOLE_VIEW_RULES } from "../sync/rules/HoleViewRules";
export type { IHoleNode } from "../sync/contracts/HoleViewContract";
import type { IHoleNode } from "../sync/contracts/HoleViewContract";

const holeRegistry = createViewNodeRegistry<IHoleNode>();

export const registerHoleNode = holeRegistry.register;
export const unregisterHoleNode = holeRegistry.unregister;
export const holeViewBinding: BindingFn = createRuleBinding(holeRegistry, HOLE_VIEW_RULES);
