import { defineQuery } from "bitecs";
import { DirtyComponent, SceneComponent } from "../../components";
import {
  BIT_SCENE_ALL,
} from "../../../binding/DirtyFlags";
import { SCENE_VIEW_RULES } from "../../../binding/rules/SceneViewRules";
import { toDirtyMarks } from "../../../binding/rules/ViewBindingRule";
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
      marks: toDirtyMarks(SCENE_VIEW_RULES),
    },
  ],
};
