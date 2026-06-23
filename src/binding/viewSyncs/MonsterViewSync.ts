import { DirtyComponent } from "../../ecs/components";
import { MonsterComponent } from "../../ecs/gameplay/monster/MonsterComponent";
import { MONSTER_SYNC_RULES } from "../../sync/rules/MonsterSyncRules";
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
  rules: MONSTER_SYNC_RULES,
  project: monsterViewBinding,
});
