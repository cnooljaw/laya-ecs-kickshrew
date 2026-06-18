import { PerfHeroComponent } from "../../ecs/components";
import { PERF_HERO_RESOURCES } from "../../config/ViewLayoutConfig";
import {
  BIT_PERF_HERO_POS,
  BIT_PERF_HERO_SCALE,
  BIT_PERF_HERO_SPAWN,
} from "../DirtyFlags";
import type { IPerfHeroNode } from "../PerfHeroViewBinding";
import { defineViewRules, row } from "./ViewBindingRule";

type PerfHeroField = Extract<keyof typeof PerfHeroComponent, string>;

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

export const PERF_HERO_VIEW_RULES = defineViewRules<IPerfHeroNode, PerfHeroField>(
  "PerfHeroComponent",
  PerfHeroComponent,
  [
    // bit                      label          fields                 apply
    row<IPerfHeroNode, PerfHeroField>(BIT_PERF_HERO_POS,   "压测英雄坐标", ["posX", "posY"],       applyHeroState),
    row<IPerfHeroNode, PerfHeroField>(BIT_PERF_HERO_SPAWN, "压测英雄重生", ["heroType", "spawnSeq"], applyHeroState),
    row<IPerfHeroNode, PerfHeroField>(BIT_PERF_HERO_SCALE, "压测英雄缩放", ["scale"],               applyHeroState),
  ],
);
