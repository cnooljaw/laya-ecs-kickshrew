import { defineQuery } from "bitecs";
import { DirtyComponent, PerfHeroComponent } from "../../components";
import { PERF_HERO_VIEW_RULES } from "../../../sync/rules/PerfHeroViewRules";
import { bitsOf, toDirtyMarks } from "../../../sync/rules/ViewBindingRule";
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
      allBits: bitsOf(PERF_HERO_VIEW_RULES),
      marks: toDirtyMarks(PERF_HERO_VIEW_RULES),
    },
  ],
};
