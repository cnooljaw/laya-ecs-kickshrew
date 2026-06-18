import type { BindingFn } from "./SyncView";
import { applyMatchedRules } from "./rules/ViewBindingRule";
import { PERF_HERO_VIEW_RULES } from "./rules/PerfHeroViewRules";

export interface IPerfHeroNode {
  playHero(heroType: number, skUrl: string, x: number, y: number, scale: number, spawnSeq: number): void;
}

const perfHeroNodeMap = new Map<number, IPerfHeroNode>();

export function registerPerfHeroNode(eid: number, node: IPerfHeroNode): void {
  perfHeroNodeMap.set(eid, node);
}

export function unregisterPerfHeroNode(eid: number): void {
  perfHeroNodeMap.delete(eid);
}

export const perfHeroViewBinding: BindingFn = (eid: number, dirtyBits: number, forceFull: boolean) => {
  const node = perfHeroNodeMap.get(eid);
  if (!node) return;

  applyMatchedRules(PERF_HERO_VIEW_RULES, { eid, node, dirtyBits, forceFull });
};
