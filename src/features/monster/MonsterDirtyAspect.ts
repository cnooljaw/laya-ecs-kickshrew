import { DirtyComponent } from "../../ecs/components";
import { createRuleDirtyAspect } from "../../ecs/dirty/RuleDirtyAspect";
import { MonsterComponent } from "./MonsterComponent";
import { MONSTER_VIEW_RULES } from "./MonsterViewRules";

export const MonsterDirtyAspect = createRuleDirtyAspect({
  name: "MonsterDirtyAspect",
  description: "拥有 MonsterComponent + DirtyComponent 的怪物实体 dirty 映射",
  requires: ["MonsterComponent", "DirtyComponent"],
  components: [MonsterComponent, DirtyComponent],
  channel: {
    name: "monsterDirty",
    storeKey: "monster",
    dirtyTarget: "monsterDirty",
    rules: MONSTER_VIEW_RULES,
  },
});
