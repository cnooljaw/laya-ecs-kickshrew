import type { BindingFn } from "./SyncView";
import { createRuleBinding, createViewNodeRegistry } from "./RuleViewBinding";
import { PERF_HERO_VIEW_RULES } from "../sync/rules/PerfHeroViewRules";

export interface IPerfHeroNode {
  playHero(heroType: number, skUrl: string, x: number, y: number, scale: number, spawnSeq: number): void;
}

const perfHeroRegistry = createViewNodeRegistry<IPerfHeroNode>();

export const registerPerfHeroNode = perfHeroRegistry.register;
export const unregisterPerfHeroNode = perfHeroRegistry.unregister;
export const perfHeroViewBinding: BindingFn = createRuleBinding(perfHeroRegistry, PERF_HERO_VIEW_RULES);
