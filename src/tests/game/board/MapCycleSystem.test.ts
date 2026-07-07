import { beforeEach, describe, expect, it } from "vitest";
import {
  BoardOccupantKind,
  HolePositions,
  HOLE_COUNT,
  MapType,
  SCENE_CYCLE_INTERVAL,
  getHoleZOrder,
} from "../../../game/board";
import { HoleComponent, SceneComponent } from "../../../game/board/BoardComponents";
import { HoleEntity, SceneEntity } from "../../../game/board/BoardEntities";
import { mapCycleSystem } from "../../../game/board/MapCycleSystem";
import { createEntityRuntime } from "../../../framework/ecs/EntityRuntime";
import { createGameWorld } from "../../../framework/ecs/GameWorld";

describe("Board MapCycleSystem", () => {
  let world: ReturnType<typeof createGameWorld>;
  let scene: number;
  let holes: number[];

  beforeEach(() => {
    world = createGameWorld();
    const entities = createEntityRuntime(world, [SceneEntity, HoleEntity]);
    entities.bootstrapSingletons();
    scene = entities.one(SceneEntity);
    holes = entities.createMany(
      HoleEntity,
      Array.from({ length: HOLE_COUNT }, (_, index) => ({
        index,
        mapType: MapType.Meadow,
      })),
    );
  });

  it("advances scene timer without switching before the configured interval", () => {
    mapCycleSystem(world, 1.5);

    expect(SceneComponent.sceneTimer[scene]).toBe(1.5);
    expect(SceneComponent.currentMap[scene]).toBe(MapType.Meadow);
  });

  it("cycles Meadow -> Ship -> Space -> Meadow", () => {
    for (const expected of [MapType.Ship, MapType.Space, MapType.Meadow]) {
      SceneComponent.sceneTimer[scene] = SCENE_CYCLE_INTERVAL;
      mapCycleSystem(world);
      expect(SceneComponent.currentMap[scene]).toBe(expected);
    }
  });

  it("updates hole positions without clearing current occupants on map switch", () => {
    const holeEid = holes[1];
    HoleComponent.residentKind[holeEid] = BoardOccupantKind.Shrew;
    HoleComponent.residentEid[holeEid] = 1001;
    HoleComponent.occupantKind[holeEid] = BoardOccupantKind.Monster;
    HoleComponent.occupantEid[holeEid] = 2001;
    SceneComponent.sceneTimer[scene] = SCENE_CYCLE_INTERVAL * 1.5;

    mapCycleSystem(world);

    expect(SceneComponent.currentMap[scene]).toBe(MapType.Ship);
    expect(SceneComponent.sceneTimer[scene]).toBe(0);
    expect(SceneComponent.transitioning[scene]).toBe(1);
    expect(HoleComponent.occupantKind[holeEid]).toBe(BoardOccupantKind.Monster);
    expect(HoleComponent.occupantEid[holeEid]).toBe(2001);

    holes.forEach((eid, index) => {
      expect(HoleComponent.posXRatio[eid]).toBeCloseTo(HolePositions[MapType.Ship].xRatios[index], 5);
      expect(HoleComponent.posYRatio[eid]).toBeCloseTo(HolePositions[MapType.Ship].yRatios[index], 5);
      expect(HoleComponent.zIndex[eid]).toBe(getHoleZOrder(HoleComponent.gridRow[eid]));
    });
  });
});
