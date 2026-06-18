/**
 * SceneViewBinding — SceneComponent → SceneLayer 绑定
 */
import type { BindingFn } from "./SyncView";
import { createRuleBinding, createViewNodeRegistry } from "./RuleViewBinding";
import { SCENE_VIEW_RULES } from "../sync/rules/SceneViewRules";

export interface ISceneLayer {
  switchScene(mapType: number): void;
  setTransitioning(transitioning: boolean): void;
}

const sceneRegistry = createViewNodeRegistry<ISceneLayer>();

export const registerSceneLayer = sceneRegistry.register;
export const unregisterSceneLayer = sceneRegistry.unregister;
export const sceneViewBinding: BindingFn = createRuleBinding(sceneRegistry, SCENE_VIEW_RULES);
