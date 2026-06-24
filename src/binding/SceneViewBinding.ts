/**
 * SceneViewBinding — SceneComponent → SceneLayer 绑定
 */
import type { BindingFn } from "./SyncView";
import { createViewSyncBinding, createViewNodeRegistry } from "./ViewSyncBinding";
import { SCENE_VIEW_SYNC_SPEC } from "../sync/viewSync/specs/SceneViewSyncSpec";
import type { ISceneLayer } from "../sync/contracts/SceneViewContract";

const sceneRegistry = createViewNodeRegistry<ISceneLayer>();

export const registerSceneLayer = sceneRegistry.register;
export const unregisterSceneLayer = sceneRegistry.unregister;
export const sceneViewBinding: BindingFn = createViewSyncBinding(sceneRegistry, SCENE_VIEW_SYNC_SPEC);
