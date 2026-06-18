import { DirtyComponent, PerfHeroComponent } from "../../components";
import { PERF_HERO_VIEW_RULES } from "../../../sync/rules/PerfHeroViewRules";
import { createRuleDirtyAspect } from "../RuleDirtyAspect";

export const PerfHeroDirtyAspect = createRuleDirtyAspect({
  name: "PerfHeroDirtyAspect",
  description: "拥有 PerfHeroComponent + DirtyComponent 的压测英雄实体 dirty 映射",
  requires: ["PerfHeroComponent", "DirtyComponent"],
  components: [PerfHeroComponent, DirtyComponent],
  channel: {
    name: "perfHeroDirty",
    storeKey: "perfHero",
    dirtyTarget: "perfHeroDirty",
    rules: PERF_HERO_VIEW_RULES,
  },
});
