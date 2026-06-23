import { DirtyComponent, PlayerComponent } from "../../ecs/components";
import { PLAYER_VIEW_RULES } from "../../sync/rules/PlayerViewRules";
import { defineViewSyncModule } from "../../sync/viewSync/ViewSyncModule";
import { playerViewBinding } from "../PlayerViewBinding";

export const PlayerViewSync = defineViewSyncModule({
  name: "player",
  aspectName: "PlayerDirtyAspect",
  description: "拥有 PlayerComponent + DirtyComponent 的玩家 HUD 单例 dirty 映射",
  requires: ["PlayerComponent", "DirtyComponent"],
  components: [PlayerComponent, DirtyComponent],
  storeKey: "player",
  dirtyTarget: "playerDirty",
  rules: PLAYER_VIEW_RULES,
  project: playerViewBinding,
});
