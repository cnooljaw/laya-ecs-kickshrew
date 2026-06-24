import { DirtyComponent, PerfHeroComponent } from "../../ecs/components";
import { PERF_HERO_VIEW_SYNC_SPEC } from "../../sync/viewSync/specs/PerfHeroViewSyncSpec";
import { defineViewSyncModule } from "../../sync/viewSync/ViewSyncModule";

export const PerfHeroViewSync = defineViewSyncModule({
  name: "perfHero",
  aspectName: "PerfHeroDirtyAspect",
  description: "拥有 PerfHeroComponent + DirtyComponent 的压测英雄实体 dirty 映射",
  requires: ["PerfHeroComponent", "DirtyComponent"],
  components: [PerfHeroComponent, DirtyComponent],
  dirtyTarget: "perfHeroDirty",
  spec: PERF_HERO_VIEW_SYNC_SPEC,
});
