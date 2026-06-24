/**
 * PlayerViewBinding — PlayerComponent → PlayerHUD 绑定
 */
import type { BindingFn } from "./SyncView";
import { createViewSyncBinding, createViewNodeRegistry } from "./ViewSyncBinding";
import { PLAYER_VIEW_SYNC_SPEC } from "../sync/viewSync/specs/PlayerViewSyncSpec";
import type { IPlayerHUD } from "../sync/contracts/PlayerViewContract";

const playerRegistry = createViewNodeRegistry<IPlayerHUD>();

export const registerPlayerHUD = playerRegistry.register;
export const unregisterPlayerHUD = playerRegistry.unregister;
export const playerViewBinding: BindingFn = createViewSyncBinding(playerRegistry, PLAYER_VIEW_SYNC_SPEC);
