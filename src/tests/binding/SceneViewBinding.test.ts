import { describe, expect, it } from "vitest";
import type { ISceneLayer } from "../../sync/contracts/SceneViewContract";
import { createGameWorld, createSingletonEntities } from "../../ecs/world";
import { SceneComponent } from "../../ecs/components";
import { createViewSyncRuntime } from "../../binding/ViewSyncRuntime";
import { SceneViewSync } from "../../binding/viewSyncs";
import { BIT_SCENE_MAP, BIT_SCENE_TIMER, BIT_SCENE_TRANSITION } from "../../sync/DirtyFlags";
import { MapType } from "../../ecs/types";

describe("SceneViewBinding", () => {
  it("表格式规则投影地图和过渡状态，sceneTimer 只参与 dirty 不触发 view", () => {
    const world = createGameWorld();
    const { scene: eid } = createSingletonEntities(world);
    const calls = {
      maps: [] as number[],
      transitions: [] as boolean[],
    };
    const node: ISceneLayer = {
      switchScene: mapType => calls.maps.push(mapType),
      setTransitioning: transitioning => calls.transitions.push(transitioning),
    };
    const runtime = createViewSyncRuntime([SceneViewSync]);
    runtime.registryFor(SceneViewSync).register(eid, node);

    SceneComponent.currentMap[eid] = MapType.Space;
    SceneComponent.transitioning[eid] = 1;
    SceneComponent.sceneTimer[eid] = 12;

    runtime.channelFor(SceneViewSync).project(
      eid,
      BIT_SCENE_MAP | BIT_SCENE_TRANSITION | BIT_SCENE_TIMER,
      false,
    );

    expect(calls.maps).toEqual([MapType.Space]);
    expect(calls.transitions).toEqual([true]);
  });
});
