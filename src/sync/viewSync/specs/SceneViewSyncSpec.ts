import { SceneComponent } from "../../../ecs/components";
import {
  BIT_SCENE_MAP,
  BIT_SCENE_TIMER,
  BIT_SCENE_TRANSITION,
} from "../../DirtyFlags";
import type { ISceneLayer } from "../../contracts/SceneViewContract";
import { createSyncRow, defineViewSyncSpec, noProjection } from "../ViewSyncSpec";

type SceneField = Extract<keyof typeof SceneComponent, string>;
const syncRow = createSyncRow<ISceneLayer, SceneField>();

function applySwitchScene({ eid, node }: { eid: number; node: ISceneLayer }): void {
  node.switchScene(SceneComponent.currentMap[eid]);
}

function applyTransitioning({ eid, node }: { eid: number; node: ISceneLayer }): void {
  node.setTransitioning(SceneComponent.transitioning[eid] === 1);
}

export const SCENE_VIEW_SYNC_SPEC = defineViewSyncSpec<ISceneLayer, SceneField>(
  "SceneComponent",
  SceneComponent,
  [
    // bit                    label          fields             apply
    syncRow(BIT_SCENE_MAP,        "当前地图",      ["currentMap"],    applySwitchScene),
    syncRow(BIT_SCENE_TIMER,      "场景计时器",    ["sceneTimer"],    noProjection),
    syncRow(BIT_SCENE_TRANSITION, "场景切换状态",  ["transitioning"], applyTransitioning),
  ],
);
