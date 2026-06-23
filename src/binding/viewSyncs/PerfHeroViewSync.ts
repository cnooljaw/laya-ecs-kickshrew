import { DirtyComponent, PerfHeroComponent } from "../../ecs/components";
import { PERF_HERO_VIEW_RULES } from "../../sync/rules/PerfHeroViewRules";
import { defineViewSyncModule } from "../../sync/viewSync/ViewSyncModule";
import { perfHeroViewBinding } from "../PerfHeroViewBinding";

export const PerfHeroViewSync = defineViewSyncModule({
  name: "perfHero",
  aspectName: "PerfHeroDirtyAspect",
  description: "拥有 PerfHeroComponent + DirtyComponent 的压测英雄实体 dirty 映射",
  requires: ["PerfHeroComponent", "DirtyComponent"],
  components: [PerfHeroComponent, DirtyComponent],
  storeKey: "perfHero",
  dirtyTarget: "perfHeroDirty",
  rules: PERF_HERO_VIEW_RULES,
  project: perfHeroViewBinding,
});
