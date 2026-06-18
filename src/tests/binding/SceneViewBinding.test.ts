import { afterEach, describe, expect, it } from "vitest";
import { createGameWorld, createSingletonEntities } from "../../ecs/world";
import { SceneComponent } from "../../ecs/components";
import {
  sceneViewBinding,
  registerSceneLayer,
  unregisterSceneLayer,
  type ISceneLayer,
} from "../../binding/SceneViewBinding";
import { BIT_SCENE_MAP, BIT_SCENE_TIMER, BIT_SCENE_TRANSITION } from "../../sync/DirtyFlags";
import { MapType } from "../../ecs/types";

describe("SceneViewBinding", () => {
  const registered: number[] = [];

  afterEach(() => {
    for (const eid of registered) {
      unregisterSceneLayer(eid);
    }
    registered.length = 0;
  });

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
    registerSceneLayer(eid, node);
    registered.push(eid);

    SceneComponent.currentMap[eid] = MapType.Space;
    SceneComponent.transitioning[eid] = 1;
    SceneComponent.sceneTimer[eid] = 12;

    sceneViewBinding(eid, BIT_SCENE_MAP | BIT_SCENE_TRANSITION | BIT_SCENE_TIMER, false);

    expect(calls.maps).toEqual([MapType.Space]);
    expect(calls.transitions).toEqual([true]);
  });
});
