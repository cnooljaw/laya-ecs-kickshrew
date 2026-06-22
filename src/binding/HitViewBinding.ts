/**
 * HitViewBinding — HitComponent → 金币/宝箱动画绑定
 */
import type { BindingFn } from "./SyncView";
import { createRuleBinding, createViewNodeRegistry } from "./RuleViewBinding";
import { HIT_VIEW_RULES } from "../sync/rules/HitViewRules";
import type { IHitEffectNode } from "../sync/contracts/HitViewContract";

const hitRegistry = createViewNodeRegistry<IHitEffectNode>();

export const registerHitEffectNode = hitRegistry.register;
export const unregisterHitEffectNode = hitRegistry.unregister;
export const hitViewBinding: BindingFn = createRuleBinding(hitRegistry, HIT_VIEW_RULES);
