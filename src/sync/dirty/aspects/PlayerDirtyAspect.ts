import { DirtyComponent, PlayerComponent } from "../../../ecs/components";
import { PLAYER_VIEW_RULES } from "../../rules/PlayerViewRules";
import { createRuleDirtyAspect } from "../RuleDirtyAspect";

export const PlayerDirtyAspect = createRuleDirtyAspect({
  name: "PlayerDirtyAspect",
  description: "拥有 PlayerComponent + DirtyComponent 的玩家 HUD 单例 dirty 映射",
  requires: ["PlayerComponent", "DirtyComponent"],
  components: [PlayerComponent, DirtyComponent],
  channel: {
    name: "playerDirty",
    storeKey: "player",
    dirtyTarget: "playerDirty",
    rules: PLAYER_VIEW_RULES,
  },
});
