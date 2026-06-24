import { DirtyComponent } from "../../ecs/components";
import { MonsterComponent } from "../../ecs/gameplay/monster/MonsterComponent";
import { MONSTER_VIEW_SYNC_SPEC } from "../../sync/viewSync/specs/MonsterViewSyncSpec";
import { defineViewSyncModule } from "../../sync/viewSync/ViewSyncModule";
import { monsterViewBinding } from "../MonsterViewBinding";

export const MonsterViewSync = defineViewSyncModule({
  name: "monster",
  aspectName: "MonsterDirtyAspect",
  description: "拥有 MonsterComponent + DirtyComponent 的怪物实体 dirty 映射",
  requires: ["MonsterComponent", "DirtyComponent"],
  components: [MonsterComponent, DirtyComponent],
  storeKey: "monster",
  dirtyTarget: "monsterDirty",
  spec: MONSTER_VIEW_SYNC_SPEC,
  project: monsterViewBinding,
});
