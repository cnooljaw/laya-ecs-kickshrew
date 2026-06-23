import { DirtyComponent } from "../../../ecs/components";
import { MonsterComponent } from "../../../ecs/gameplay/monster/MonsterComponent";
import { MONSTER_SYNC_RULES } from "../../rules/MonsterSyncRules";
import { createRuleDirtyAspect } from "../RuleDirtyAspect";

export const MonsterDirtyAspect = createRuleDirtyAspect({
  name: "MonsterDirtyAspect",
  description: "拥有 MonsterComponent + DirtyComponent 的怪物实体 dirty 映射",
  requires: ["MonsterComponent", "DirtyComponent"],
  components: [MonsterComponent, DirtyComponent],
  channel: {
    name: "monsterDirty",
    storeKey: "monster",
    dirtyTarget: "monsterDirty",
    rules: MONSTER_SYNC_RULES,
  },
});
