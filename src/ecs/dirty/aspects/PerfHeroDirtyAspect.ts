import { defineQuery } from "bitecs";
import { DirtyComponent, PerfHeroComponent } from "../../components";
import {
  BIT_PERF_HERO_ALL,
  BIT_PERF_HERO_POS,
  BIT_PERF_HERO_SCALE,
  BIT_PERF_HERO_SPAWN,
} from "../../../binding/DirtyFlags";
import { field, mark } from "../DirtyField";
import type { DirtyAspect } from "../DirtySchemaTypes";

const perfHeroQuery = defineQuery([PerfHeroComponent, DirtyComponent]);

export const PerfHeroDirtyAspect: DirtyAspect = {
  name: "PerfHeroDirtyAspect",
  description: "拥有 PerfHeroComponent + DirtyComponent 的压测英雄实体 dirty 映射",
  requires: ["PerfHeroComponent", "DirtyComponent"],
  query: perfHeroQuery,
  channels: [
    {
      name: "perfHeroDirty",
      storeKey: "perfHero",
      dirtyTarget: "perfHeroDirty",
      allBits: BIT_PERF_HERO_ALL,
      marks: [
        mark(BIT_PERF_HERO_POS, "压测英雄坐标", [
          field("PerfHeroComponent.posX", PerfHeroComponent.posX),
          field("PerfHeroComponent.posY", PerfHeroComponent.posY),
        ], "PerfHeroNode.applyState"),
        mark(BIT_PERF_HERO_SPAWN, "压测英雄重生", [
          field("PerfHeroComponent.heroType", PerfHeroComponent.heroType),
          field("PerfHeroComponent.spawnSeq", PerfHeroComponent.spawnSeq),
        ], "PerfHeroNode.applyState"),
        mark(BIT_PERF_HERO_SCALE, "压测英雄缩放", [
          field("PerfHeroComponent.scale", PerfHeroComponent.scale),
        ], "PerfHeroNode.applyState"),
      ],
    },
  ],
};
