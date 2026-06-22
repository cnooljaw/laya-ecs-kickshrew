import { DirtyComponent } from "../../components";
import { createRuleDirtyAspect } from "../../dirty/RuleDirtyAspect";
import { MONSTER_SYNC_RULES } from "../../../sync/rules/MonsterSyncRules";
import { MonsterComponent } from "./MonsterComponent";

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
