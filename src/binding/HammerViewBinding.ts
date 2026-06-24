/**
 * HammerViewBinding — HammerComponent → HammerNode 绑定
 */
import type { BindingFn } from "./SyncView";
import { createViewSyncBinding, createViewNodeRegistry } from "./ViewSyncBinding";
import { HAMMER_VIEW_SYNC_SPEC } from "../sync/viewSync/specs/HammerViewSyncSpec";
import type { IHammerNode } from "../sync/contracts/HammerViewContract";

const hammerRegistry = createViewNodeRegistry<IHammerNode>();

export const registerHammerNode = hammerRegistry.register;
export const unregisterHammerNode = hammerRegistry.unregister;
export const hammerViewBinding: BindingFn = createViewSyncBinding(hammerRegistry, HAMMER_VIEW_SYNC_SPEC);
