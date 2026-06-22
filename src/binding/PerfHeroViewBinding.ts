import type { BindingFn } from "./SyncView";
import { createRuleBinding, createViewNodeRegistry } from "./RuleViewBinding";
import { PERF_HERO_VIEW_RULES } from "../sync/rules/PerfHeroViewRules";
import type { IPerfHeroNode } from "../sync/contracts/PerfHeroViewContract";

const perfHeroRegistry = createViewNodeRegistry<IPerfHeroNode>();

export const registerPerfHeroNode = perfHeroRegistry.register;
export const unregisterPerfHeroNode = perfHeroRegistry.unregister;
export const perfHeroViewBinding: BindingFn = createRuleBinding(perfHeroRegistry, PERF_HERO_VIEW_RULES);
