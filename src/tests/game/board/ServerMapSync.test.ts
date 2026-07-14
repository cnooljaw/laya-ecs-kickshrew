import { beforeEach, describe, expect, it } from "vitest";
import { createEntityRuntime } from "../../../framework/ecs/EntityRuntime";
import { createGameWorld } from "../../../framework/ecs/GameWorld";
import { HolePositions, HOLE_COUNT, MapType } from "../../../game/board";
import { HoleComponent, SceneComponent } from "../../../game/board/BoardComponents";
import { HoleEntity, SceneEntity } from "../../../game/board/BoardEntities";
import { applyServerMapTimeline, syncServerMap } from "../../../game/board/ServerMapSync";

describe("ServerMapSync", () => {
  let world: ReturnType<typeof createGameWorld>;
  let scene: number;
  let holes: number[];

  beforeEach(() => {
    world = createGameWorld();
    const entities = createEntityRuntime(world, [SceneEntity, HoleEntity]);
    entities.bootstrapSingletons();
    scene = entities.one(SceneEntity);
    holes = entities.createMany(HoleEntity, Array.from({ length: HOLE_COUNT }, (_, index) => ({ index, mapType: MapType.Meadow })));
  });

  it("uses the server timeline rather than local delta and rejects older revisions", () => {
    applyServerMapTimeline(world, {
      currentMap: MapType.Meadow,
      mapRevision: 7,
      mapStartedMs: 10_800,
      nextSwitchMs: 26_800,
      nextMap: MapType.Ship,
      cycleMs: 16_000,
    }, 10_800);

    syncServerMap(world, 26_800);
    expect(SceneComponent.serverControlled[scene]).toBe(1);
    expect(SceneComponent.currentMap[scene]).toBe(MapType.Ship);
    holes.forEach((eid, index) => {
      expect(HoleComponent.posXRatio[eid]).toBeCloseTo(HolePositions[MapType.Ship].xRatios[index], 5);
    });

    applyServerMapTimeline(world, {
      currentMap: MapType.Meadow,
      mapRevision: 6,
      mapStartedMs: 0,
      nextSwitchMs: 16_000,
      nextMap: MapType.Ship,
      cycleMs: 16_000,
    }, 26_800);
    expect(SceneComponent.currentMap[scene]).toBe(MapType.Ship);
    expect(SceneComponent.mapRevision[scene]).toBe(7);
  });
});
