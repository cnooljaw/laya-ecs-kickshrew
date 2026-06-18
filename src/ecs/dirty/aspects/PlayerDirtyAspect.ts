import { defineQuery } from "bitecs";
import { DirtyComponent, PlayerComponent } from "../../components";
import {
  BIT_PLAYER_ALL,
} from "../../../binding/DirtyFlags";
import { PLAYER_VIEW_RULES } from "../../../binding/rules/PlayerViewRules";
import { toDirtyMarks } from "../../../binding/rules/ViewBindingRule";
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
      allBits: BIT_PLAYER_ALL,
      marks: toDirtyMarks(PLAYER_VIEW_RULES),
    },
  ],
};
