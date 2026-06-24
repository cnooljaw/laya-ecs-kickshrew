/**
 * HoleViewBinding — HoleComponent → HoleNode 绑定
 */
import type { BindingFn } from "./SyncView";
import { createViewSyncBinding, createViewNodeRegistry } from "./ViewSyncBinding";
import { HOLE_VIEW_SYNC_SPEC } from "../sync/viewSync/specs/HoleViewSyncSpec";
import type { IHoleNode } from "../sync/contracts/HoleViewContract";

const holeRegistry = createViewNodeRegistry<IHoleNode>();

export const registerHoleNode = holeRegistry.register;
export const unregisterHoleNode = holeRegistry.unregister;
export const holeViewBinding: BindingFn = createViewSyncBinding(holeRegistry, HOLE_VIEW_SYNC_SPEC);
