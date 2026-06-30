import { beforeEach, describe, expect, it } from "vitest";
import { HolePositions, getHoleZOrder } from "../../../../game/features/shrew";
import { SCENE_CYCLE_INTERVAL } from "../../../../game/features/shrew";
import { HoleComponent, SceneComponent, ShrewComponent } from "../../../../game/features/shrew";
import { HoleEntity, SceneEntity, ShrewEntity } from "../../../../game/features/shrew";
import { mapCycleSystem } from "../../../../game/features/shrew";
import { createEntityRuntime } from "../../../../framework/ecs/EntityRuntime";
import { HOLE_COUNT, MapType, ShrewAction, ShrewType } from "../../../../game/features/shrew";
import { createGameWorld } from "../../../../framework/ecs/GameWorld";

describe("MapCycleSystem", () => {
  let world: ReturnType<typeof createGameWorld>;
  let scene: number;
  let holes: number[];
  let shrews: number[];

  beforeEach(() => {
    world = createGameWorld();
    const entities = createEntityRuntime(world, [SceneEntity, HoleEntity, ShrewEntity]);
    entities.bootstrapSingletons();
    scene = entities.one(SceneEntity);
    holes = entities.createMany(
      HoleEntity,
      Array.from({ length: HOLE_COUNT }, (_, index) => ({
        index,
        mapType: MapType.Meadow,
      })),
    );
    shrews = Array.from({ length: HOLE_COUNT }, () => {
      const eid = entities.create(ShrewEntity, {
        shrewType: ShrewType.Red,
        mapType: MapType.Meadow,
      });
      ShrewComponent.actionState[eid] = ShrewAction.Stand;
      ShrewComponent.isClickable[eid] = 1;
      return eid;
    });
  });

  it("does not switch before the configured interval", () => {
    SceneComponent.sceneTimer[scene] = SCENE_CYCLE_INTERVAL - 0.01;

    mapCycleSystem(world);

    expect(SceneComponent.currentMap[scene]).toBe(MapType.Meadow);
  });

  it("cycles Meadow -> Ship -> Space -> Meadow", () => {
    for (const expected of [MapType.Ship, MapType.Space, MapType.Meadow]) {
      SceneComponent.sceneTimer[scene] = SCENE_CYCLE_INTERVAL;
      mapCycleSystem(world);
      expect(SceneComponent.currentMap[scene]).toBe(expected);
    }
  });

  it("resets runtime state and applies the next map to shrews and holes", () => {
    SceneComponent.sceneTimer[scene] = SCENE_CYCLE_INTERVAL * 1.5;

    mapCycleSystem(world);

    expect(SceneComponent.currentMap[scene]).toBe(MapType.Ship);
    expect(SceneComponent.sceneTimer[scene]).toBe(0);
    expect(SceneComponent.transitioning[scene]).toBe(1);

    for (const eid of shrews) {
      expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Wait);
      expect(ShrewComponent.isClickable[eid]).toBe(0);
      expect(ShrewComponent.animTimer[eid]).toBeGreaterThanOrEqual(1);
      expect(ShrewComponent.animTimer[eid]).toBeLessThanOrEqual(8);
      expect(ShrewComponent.mapType[eid]).toBe(MapType.Ship);
    }

    holes.forEach((eid, index) => {
      expect(HoleComponent.posXRatio[eid]).toBeCloseTo(HolePositions[MapType.Ship].xRatios[index], 5);
      expect(HoleComponent.posYRatio[eid]).toBeCloseTo(HolePositions[MapType.Ship].yRatios[index], 5);
      expect(HoleComponent.zIndex[eid]).toBe(getHoleZOrder(HoleComponent.gridRow[eid]));
    });
  });
});
