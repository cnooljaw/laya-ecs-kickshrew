/**
 * PlayerViewBinding — PlayerComponent → PlayerHUD 绑定
 */
import type { BindingFn } from "./SyncView";
import { applyMatchedRules } from "./rules/ViewBindingRule";
import { PLAYER_VIEW_RULES } from "./rules/PlayerViewRules";

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

  applyMatchedRules(PLAYER_VIEW_RULES, { eid, node, dirtyBits, forceFull });
};
