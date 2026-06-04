import { PerfHeroComponent } from "../ecs/components";
import { PERF_HERO_RESOURCES } from "../config/ViewLayoutConfig";
import { BIT_PERF_HERO_POS, BIT_PERF_HERO_SCALE, BIT_PERF_HERO_SPAWN } from "./DirtyFlags";
import type { BindingFn } from "./SyncView";

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

  if (
    forceFull ||
    (dirtyBits & BIT_PERF_HERO_SPAWN) ||
    (dirtyBits & BIT_PERF_HERO_POS) ||
    (dirtyBits & BIT_PERF_HERO_SCALE)
  ) {
    const heroType = PerfHeroComponent.heroType[eid];
    const resource = PERF_HERO_RESOURCES[heroType] ?? PERF_HERO_RESOURCES[0];
    node.playHero(
      heroType,
      resource.skUrl,
      PerfHeroComponent.posX[eid],
      PerfHeroComponent.posY[eid],
      PerfHeroComponent.scale[eid],
      PerfHeroComponent.spawnSeq[eid],
    );
  }
};
