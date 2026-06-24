import { PerfHeroComponent } from "../../../ecs/components";
import { PERF_HERO_RESOURCES } from "../../../config/ViewLayoutConfig";
import {
  BIT_PERF_HERO_POS,
  BIT_PERF_HERO_SCALE,
  BIT_PERF_HERO_SPAWN,
} from "../../DirtyFlags";
import type { IPerfHeroNode } from "../../contracts/PerfHeroViewContract";
import { createSyncRow, defineViewSyncSpec } from "../ViewSyncSpec";

type PerfHeroField = Extract<keyof typeof PerfHeroComponent, string>;
const syncRow = createSyncRow<IPerfHeroNode, PerfHeroField>();

function applyHeroState({ eid, node }: { eid: number; node: IPerfHeroNode }): void {
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

export const PERF_HERO_VIEW_SYNC_SPEC = defineViewSyncSpec<IPerfHeroNode, PerfHeroField>(
  "PerfHeroComponent",
  PerfHeroComponent,
  [
    // bit                      label          fields                 apply
    syncRow(BIT_PERF_HERO_POS,   "压测英雄坐标", ["posX", "posY"],       applyHeroState),
    syncRow(BIT_PERF_HERO_SPAWN, "压测英雄重生", ["heroType", "spawnSeq"], applyHeroState),
    syncRow(BIT_PERF_HERO_SCALE, "压测英雄缩放", ["scale"],               applyHeroState),
  ],
);
