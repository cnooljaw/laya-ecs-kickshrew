import { defineQuery } from "bitecs";
import { DirtyComponent, PlayerComponent } from "../../components";
import { PLAYER_VIEW_RULES } from "../../../sync/rules/PlayerViewRules";
import { bitsOf, toDirtyMarks } from "../../../sync/rules/ViewBindingRule";
import type { DirtyAspect } from "../DirtySchemaTypes";

const playerQuery = defineQuery([PlayerComponent, DirtyComponent]);

export const PlayerDirtyAspect: DirtyAspect = {
  name: "PlayerDirtyAspect",
  description: "拥有 PlayerComponent + DirtyComponent 的玩家 HUD 单例 dirty 映射",
  requires: ["PlayerComponent", "DirtyComponent"],
  query: playerQuery,
  channels: [
    {
      name: "playerDirty",
      storeKey: "player",
      dirtyTarget: "playerDirty",
      allBits: bitsOf(PLAYER_VIEW_RULES),
      marks: toDirtyMarks(PLAYER_VIEW_RULES),
    },
  ],
};
