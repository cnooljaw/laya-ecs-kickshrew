import { defineQuery } from "bitecs";
import { DirtyComponent, SceneComponent } from "../../components";
import { SCENE_VIEW_RULES } from "../../../sync/rules/SceneViewRules";
import { bitsOf, toDirtyMarks } from "../../../sync/rules/ViewBindingRule";
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
      allBits: bitsOf(SCENE_VIEW_RULES),
      marks: toDirtyMarks(SCENE_VIEW_RULES),
    },
  ],
};
