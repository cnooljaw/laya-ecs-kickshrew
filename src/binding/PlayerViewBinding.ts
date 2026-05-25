/**
 * PlayerViewBinding — PlayerComponent → PlayerHUD 绑定
 */
import { PlayerComponent } from "../ecs/components";
import { BIT_PLAYER_MONEY, BIT_PLAYER_ANGRY, BIT_PLAYER_POWER, BIT_PLAYER_LEVEL } from "./DirtyFlags";
import type { BindingFn } from "./SyncView";

export interface IPlayerHUD {
  setMoney(value: number): void;
  setAngry(value: number): void;
  setPower(value: number, max: number): void;
  setLevel(value: number): void;
}

const playerNodeMap = new Map<number, IPlayerHUD>();

export function registerPlayerHUD(eid: number, node: IPlayerHUD): void { playerNodeMap.set(eid, node); }
export function unregisterPlayerHUD(eid: number): void { playerNodeMap.delete(eid); }

export const playerViewBinding: BindingFn = (eid: number, dirtyBits: number, forceFull: boolean) => {
  const node = playerNodeMap.get(eid);
  if (!node) return;

  if (forceFull || (dirtyBits & BIT_PLAYER_MONEY)) {
    node.setMoney(PlayerComponent.money[eid]);
  }
  if (forceFull || (dirtyBits & BIT_PLAYER_ANGRY)) {
    node.setAngry(PlayerComponent.angry[eid]);
  }
  if (forceFull || (dirtyBits & BIT_PLAYER_POWER)) {
    node.setPower(PlayerComponent.power[eid], PlayerComponent.powerTop[eid]);
  }
  if (forceFull || (dirtyBits & BIT_PLAYER_LEVEL)) {
    node.setLevel(PlayerComponent.level[eid]);
  }
};
