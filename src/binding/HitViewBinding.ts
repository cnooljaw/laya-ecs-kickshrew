/**
 * HitViewBinding — HitComponent → 金币/宝箱动画绑定
 */
import type { BindingFn } from "./SyncView";
import { createViewSyncBinding, createViewNodeRegistry } from "./ViewSyncBinding";
import { HIT_VIEW_SYNC_SPEC } from "../sync/viewSync/specs/HitViewSyncSpec";
import type { IHitEffectNode } from "../sync/contracts/HitViewContract";

const hitRegistry = createViewNodeRegistry<IHitEffectNode>();

export const registerHitEffectNode = hitRegistry.register;
export const unregisterHitEffectNode = hitRegistry.unregister;
export const hitViewBinding: BindingFn = createViewSyncBinding(hitRegistry, HIT_VIEW_SYNC_SPEC);
