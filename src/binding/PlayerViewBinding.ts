/**
 * PlayerViewBinding — PlayerComponent → PlayerHUD 绑定
 */
import type { BindingFn } from "./SyncView";
import { createRuleBinding, createViewNodeRegistry } from "./RuleViewBinding";
import { PLAYER_VIEW_RULES } from "../sync/rules/PlayerViewRules";

export interface IPlayerHUD {
  setMoney(value: number): void;
  setAngry(value: number): void;
  setPower(value: number, max: number): void;
  setLevel(value: number): void;
}

const playerRegistry = createViewNodeRegistry<IPlayerHUD>();

export const registerPlayerHUD = playerRegistry.register;
export const unregisterPlayerHUD = playerRegistry.unregister;
export const playerViewBinding: BindingFn = createRuleBinding(playerRegistry, PLAYER_VIEW_RULES);
