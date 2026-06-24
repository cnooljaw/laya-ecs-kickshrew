import { DirtyComponent, PlayerComponent } from "../../ecs/components";
import { PLAYER_VIEW_SYNC_SPEC } from "../../sync/viewSync/specs/PlayerViewSyncSpec";
import { defineViewSyncModule } from "../../sync/viewSync/ViewSyncModule";

export const PlayerViewSync = defineViewSyncModule({
  name: "player",
  aspectName: "PlayerDirtyAspect",
  description: "拥有 PlayerComponent + DirtyComponent 的玩家 HUD 单例 dirty 映射",
  requires: ["PlayerComponent", "DirtyComponent"],
  components: [PlayerComponent, DirtyComponent],
  dirtyTarget: "playerDirty",
  spec: PLAYER_VIEW_SYNC_SPEC,
});
