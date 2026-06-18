/**
 * HoleViewBinding — HoleComponent → HoleNode 绑定
 */
import type { BindingFn } from "./SyncView";
import { createRuleBinding, createViewNodeRegistry } from "./RuleViewBinding";
import { HOLE_VIEW_RULES } from "../sync/rules/HoleViewRules";

export interface IHoleNode {
  setPosition(xRatio: number, yRatio: number): void;
  setShrewVisible(shrewEid: number): void;
  setZOrder(z: number): void;
}

const holeRegistry = createViewNodeRegistry<IHoleNode>();

export const registerHoleNode = holeRegistry.register;
export const unregisterHoleNode = holeRegistry.unregister;
export const holeViewBinding: BindingFn = createRuleBinding(holeRegistry, HOLE_VIEW_RULES);
