import { defineQuery } from "bitecs";
import { DirtyComponent, SceneComponent } from "../../components";
import {
  BIT_SCENE_ALL,
  BIT_SCENE_MAP,
  BIT_SCENE_TIMER,
  BIT_SCENE_TRANSITION,
} from "../../../binding/DirtyFlags";
import { field, mark } from "../DirtyField";
import type { DirtyAspect } from "../DirtySchemaTypes";

const sceneQuery = defineQuery([SceneComponent, DirtyComponent]);

export const SceneDirtyAspect: DirtyAspect = {
  name: "SceneDirtyAspect",
  description: "拥有 SceneComponent + DirtyComponent 的场景单例 dirty 映射",
  requires: ["SceneComponent", "DirtyComponent"],
  query: sceneQuery,
  channels: [
    {
      name: "sceneDirty",
      storeKey: "scene",
      dirtyTarget: "sceneDirty",
      allBits: BIT_SCENE_ALL,
      marks: [
        mark(BIT_SCENE_MAP, "当前地图", [
          field("SceneComponent.currentMap", SceneComponent.currentMap),
        ], "SceneLayer.setMap"),
        mark(BIT_SCENE_TIMER, "场景计时器", [
          field("SceneComponent.sceneTimer", SceneComponent.sceneTimer),
        ], "SceneViewBinding.sceneTimer"),
        mark(BIT_SCENE_TRANSITION, "场景切换状态", [
          field("SceneComponent.transitioning", SceneComponent.transitioning),
        ], "SceneLayer.setTransitioning"),
      ],
    },
  ],
};
