import { PlayerComponent } from "../../../ecs/components";
import {
  BIT_PLAYER_ANGRY,
  BIT_PLAYER_LEVEL,
  BIT_PLAYER_MONEY,
  BIT_PLAYER_POWER,
} from "../../DirtyFlags";
import type { IPlayerHUD } from "../../contracts/PlayerViewContract";
import { createSyncRow, defineViewSyncSpec } from "../ViewSyncSpec";

type PlayerField = Extract<keyof typeof PlayerComponent, string>;
const syncRow = createSyncRow<IPlayerHUD, PlayerField>();

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

export const PLAYER_VIEW_SYNC_SPEC = defineViewSyncSpec<IPlayerHUD, PlayerField>(
  "PlayerComponent",
  PlayerComponent,
  [
    // bit                  label   fields                 apply
    syncRow(BIT_PLAYER_MONEY, "金币", ["money"],             applyMoney),
    syncRow(BIT_PLAYER_ANGRY, "怒气", ["angry"],             applyAngry),
    syncRow(BIT_PLAYER_POWER, "体力", ["power", "powerTop"], applyPower),
    syncRow(BIT_PLAYER_LEVEL, "等级", ["level"],             applyLevel),
  ],
);
