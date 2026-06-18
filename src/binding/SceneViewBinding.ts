/**
 * SceneViewBinding — SceneComponent → SceneLayer 绑定
 */
import type { BindingFn } from "./SyncView";
import { applyMatchedRules } from "./rules/ViewBindingRule";
import { SCENE_VIEW_RULES } from "./rules/SceneViewRules";

export interface ISceneLayer {
  switchScene(mapType: number): void;
  setTransitioning(transitioning: boolean): void;
}

const sceneNodeMap = new Map<number, ISceneLayer>();

export function registerSceneLayer(eid: number, node: ISceneLayer): void { sceneNodeMap.set(eid, node); }
export function unregisterSceneLayer(eid: number): void { sceneNodeMap.delete(eid); }

export const sceneViewBinding: BindingFn = (eid: number, dirtyBits: number, forceFull: boolean) => {
  const node = sceneNodeMap.get(eid);
  if (!node) return;

  applyMatchedRules(SCENE_VIEW_RULES, { eid, node, dirtyBits, forceFull });
};
