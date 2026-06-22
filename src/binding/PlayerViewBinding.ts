/**
 * PlayerViewBinding — PlayerComponent → PlayerHUD 绑定
 */
import type { BindingFn } from "./SyncView";
import { createRuleBinding, createViewNodeRegistry } from "./RuleViewBinding";
import { PLAYER_VIEW_RULES } from "../sync/rules/PlayerViewRules";
import type { IPlayerHUD } from "../sync/contracts/PlayerViewContract";

const playerRegistry = createViewNodeRegistry<IPlayerHUD>();

export const registerPlayerHUD = playerRegistry.register;
export const unregisterPlayerHUD = playerRegistry.unregister;
export const playerViewBinding: BindingFn = createRuleBinding(playerRegistry, PLAYER_VIEW_RULES);
