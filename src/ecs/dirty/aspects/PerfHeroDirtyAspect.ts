import { defineQuery } from "bitecs";
import { DirtyComponent, PerfHeroComponent } from "../../components";
import {
  BIT_PERF_HERO_ALL,
} from "../../../binding/DirtyFlags";
import { PERF_HERO_VIEW_RULES } from "../../../binding/rules/PerfHeroViewRules";
import { toDirtyMarks } from "../../../binding/rules/ViewBindingRule";
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
      marks: toDirtyMarks(PERF_HERO_VIEW_RULES),
    },
  ],
};
