/**
 * SceneViewBinding — SceneComponent → SceneLayer 绑定
 */
import { SceneComponent } from "../ecs/components";
import { BIT_SCENE_MAP, BIT_SCENE_TRANSITION } from "./DirtyFlags";
import type { BindingFn } from "./SyncView";

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

  if (forceFull || (dirtyBits & BIT_SCENE_MAP)) {
    node.switchScene(SceneComponent.currentMap[eid]);
  }
  if (forceFull || (dirtyBits & BIT_SCENE_TRANSITION)) {
    node.setTransitioning(SceneComponent.transitioning[eid] === 1);
  }
};
