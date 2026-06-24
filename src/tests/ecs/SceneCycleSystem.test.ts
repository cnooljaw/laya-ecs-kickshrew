import { beforeEach, describe, expect, it } from "vitest";
import { HolePositions, getHoleZOrder } from "../../config/HolePositions";
import { SCENE_CYCLE_INTERVAL } from "../../config/SceneConfig";
import { DirtyComponent, HoleComponent, SceneComponent, ShrewComponent } from "../../ecs/components";
import { sceneCycleSystem } from "../../ecs/gameplay/core/SceneCycleSystem";
import { HOLE_COUNT, MapType, ShrewAction, ShrewType } from "../../ecs/types";
import {
  createGameWorld,
  createHoleEntities,
  createShrewEntity,
  createSingletonEntities,
} from "../../ecs/world";

describe("SceneCycleSystem", () => {
  let world: ReturnType<typeof createGameWorld>;
  let singletons: ReturnType<typeof createSingletonEntities>;
  let holes: number[];
  let shrews: number[];

  beforeEach(() => {
    world = createGameWorld();
    singletons = createSingletonEntities(world);
    holes = createHoleEntities(world, MapType.Meadow);
    shrews = Array.from({ length: HOLE_COUNT }, () => {
      const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
      ShrewComponent.actionState[eid] = ShrewAction.Stand;
      ShrewComponent.isClickable[eid] = 1;
      return eid;
    });
  });

  it("does not switch before the configured interval", () => {
    SceneComponent.sceneTimer[singletons.scene] = SCENE_CYCLE_INTERVAL - 0.01;

    sceneCycleSystem(world);

    expect(SceneComponent.currentMap[singletons.scene]).toBe(MapType.Meadow);
  });

  it("cycles Meadow -> Ship -> Space -> Meadow", () => {
    for (const expected of [MapType.Ship, MapType.Space, MapType.Meadow]) {
      SceneComponent.sceneTimer[singletons.scene] = SCENE_CYCLE_INTERVAL;
      sceneCycleSystem(world);
      expect(SceneComponent.currentMap[singletons.scene]).toBe(expected);
    }
  });

  it("resets runtime state and applies the next map to shrews and holes", () => {
    SceneComponent.sceneTimer[singletons.scene] = SCENE_CYCLE_INTERVAL * 1.5;

    sceneCycleSystem(world);

    expect(SceneComponent.currentMap[singletons.scene]).toBe(MapType.Ship);
    expect(SceneComponent.sceneTimer[singletons.scene]).toBe(0);
    expect(SceneComponent.transitioning[singletons.scene]).toBe(1);
    expect(DirtyComponent.forceFullSync[singletons.scene]).toBe(1);

    for (const eid of shrews) {
      expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Wait);
      expect(ShrewComponent.isClickable[eid]).toBe(0);
      expect(ShrewComponent.animTimer[eid]).toBeGreaterThanOrEqual(1);
      expect(ShrewComponent.animTimer[eid]).toBeLessThanOrEqual(8);
      expect(ShrewComponent.mapType[eid]).toBe(MapType.Ship);
      expect(DirtyComponent.forceFullSync[eid]).toBe(1);
    }

    holes.forEach((eid, index) => {
      expect(HoleComponent.posXRatio[eid]).toBeCloseTo(HolePositions[MapType.Ship].xRatios[index], 5);
      expect(HoleComponent.posYRatio[eid]).toBeCloseTo(HolePositions[MapType.Ship].yRatios[index], 5);
      expect(HoleComponent.zIndex[eid]).toBe(getHoleZOrder(HoleComponent.gridRow[eid]));
      expect(DirtyComponent.forceFullSync[eid]).toBe(1);
    });
  });
});
