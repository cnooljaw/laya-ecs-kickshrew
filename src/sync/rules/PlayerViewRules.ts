import { PlayerComponent } from "../../ecs/components";
import {
  BIT_PLAYER_ANGRY,
  BIT_PLAYER_LEVEL,
  BIT_PLAYER_MONEY,
  BIT_PLAYER_POWER,
} from "../../binding/DirtyFlags";
import type { IPlayerHUD } from "../../binding/PlayerViewBinding";
import { createRule, defineViewRules } from "./ViewBindingRule";

type PlayerField = Extract<keyof typeof PlayerComponent, string>;
const rule = createRule<IPlayerHUD, PlayerField>();

function applyMoney({ eid, node }: { eid: number; node: IPlayerHUD }): void {
  node.setMoney(PlayerComponent.money[eid]);
}

function applyAngry({ eid, node }: { eid: number; node: IPlayerHUD }): void {
  node.setAngry(PlayerComponent.angry[eid]);
}

function applyPower({ eid, node }: { eid: number; node: IPlayerHUD }): void {
  node.setPower(PlayerComponent.power[eid], PlayerComponent.powerTop[eid]);
}

function applyLevel({ eid, node }: { eid: number; node: IPlayerHUD }): void {
  node.setLevel(PlayerComponent.level[eid]);
}

export const PLAYER_VIEW_RULES = defineViewRules<IPlayerHUD, PlayerField>(
  "PlayerComponent",
  PlayerComponent,
  [
    // bit                  label   fields                 apply
    rule(BIT_PLAYER_MONEY, "金币", ["money"],             applyMoney),
    rule(BIT_PLAYER_ANGRY, "怒气", ["angry"],             applyAngry),
    rule(BIT_PLAYER_POWER, "体力", ["power", "powerTop"], applyPower),
    rule(BIT_PLAYER_LEVEL, "等级", ["level"],             applyLevel),
  ],
);
