import { defineQuery } from "bitecs";
import { DirtyComponent, PlayerComponent } from "../../components";
import {
  BIT_PLAYER_ALL,
  BIT_PLAYER_ANGRY,
  BIT_PLAYER_LEVEL,
  BIT_PLAYER_MONEY,
  BIT_PLAYER_POWER,
} from "../../../binding/DirtyFlags";
import { field, mark } from "../DirtyField";
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
      marks: [
        mark(BIT_PLAYER_MONEY, "金币", [
          field("PlayerComponent.money", PlayerComponent.money),
        ], "PlayerHUD.setMoney"),
        mark(BIT_PLAYER_ANGRY, "怒气", [
          field("PlayerComponent.angry", PlayerComponent.angry),
        ], "PlayerHUD.setAngry"),
        mark(BIT_PLAYER_POWER, "体力", [
          field("PlayerComponent.power", PlayerComponent.power),
          field("PlayerComponent.powerTop", PlayerComponent.powerTop),
        ], "PlayerHUD.setPower"),
        mark(BIT_PLAYER_LEVEL, "等级", [
          field("PlayerComponent.level", PlayerComponent.level),
        ], "PlayerHUD.setLevel"),
      ],
    },
  ],
};
