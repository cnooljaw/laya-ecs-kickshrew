import { SceneComponent } from "../../ecs/components";
import {
  BIT_SCENE_MAP,
  BIT_SCENE_TIMER,
  BIT_SCENE_TRANSITION,
} from "../DirtyFlags";
import type { ISceneLayer } from "../contracts/SceneViewContract";
import { createRule, defineViewRules, noView } from "./ViewBindingRule";

type SceneField = Extract<keyof typeof SceneComponent, string>;
const rule = createRule<ISceneLayer, SceneField>();

function applySwitchScene({ eid, node }: { eid: number; node: ISceneLayer }): void {
  node.switchScene(SceneComponent.currentMap[eid]);
}

function applyTransitioning({ eid, node }: { eid: number; node: ISceneLayer }): void {
  node.setTransitioning(SceneComponent.transitioning[eid] === 1);
}

export const SCENE_VIEW_RULES = defineViewRules<ISceneLayer, SceneField>(
  "SceneComponent",
  SceneComponent,
  [
    // bit                    label          fields             apply
    rule(BIT_SCENE_MAP,        "当前地图",      ["currentMap"],    applySwitchScene),
    rule(BIT_SCENE_TIMER,      "场景计时器",    ["sceneTimer"],    noView),
    rule(BIT_SCENE_TRANSITION, "场景切换状态",  ["transitioning"], applyTransitioning),
  ],
);
