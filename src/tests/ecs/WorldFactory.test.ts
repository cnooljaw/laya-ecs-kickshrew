import { hasComponent } from "bitecs";
import { describe, expect, it } from "vitest";
import { HolePositions, SCENE_CYCLE_INTERVAL } from "../../game/board/assembly";
import {
  AnimationComponent,
  ShrewComponent,
} from "../../game/features/shrew/assembly";
import { HoleComponent, SceneComponent } from "../../game/board/assembly";
import { PlayerComponent } from "../../game/features/playerHud/assembly";
import {
  HoleEntity,
  SceneEntity,
} from "../../game/board/assembly";
import {
  ShrewEntity,
} from "../../game/features/shrew/assembly";
import { PlayerEntity } from "../../game/features/playerHud/assembly";
import { createEntityRuntime } from "../../framework/ecs/EntityRuntime";
import { HOLE_COUNT, MapType } from "../../game/board/assembly";
import { ShrewAction, ShrewType } from "../../game/features/shrew/assembly";
import { createGameWorld } from "../../framework/ecs/GameWorld";

describe("world factory", () => {
  it.each([
    { type: ShrewType.Red, map: MapType.Meadow, hp: 1, hasHat: 0 },
    { type: ShrewType.Blue, map: MapType.Meadow, hp: 2, hasHat: 1 },
    { type: ShrewType.Yellow, map: MapType.Ship, hp: 1, hasHat: 0 },
    { type: ShrewType.Green, map: MapType.Space, hp: 1, hasHat: 0 },
  ])("creates $type shrew with its gameplay defaults", ({ type, map, hp, hasHat }) => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, [ShrewEntity]);
    const entity = entities.create(ShrewEntity, { shrewType: type, mapType: map });

    expect(hasComponent(world, ShrewComponent, entity)).toBe(true);
    expect(hasComponent(world, AnimationComponent, entity)).toBe(true);
    expect(ShrewComponent.shrewType[entity]).toBe(type);
    expect(ShrewComponent.mapType[entity]).toBe(map);
    expect(ShrewComponent.hp[entity]).toBe(hp);
    expect(ShrewComponent.hasHat[entity]).toBe(hasHat);
    expect(ShrewComponent.actionState[entity]).toBe(ShrewAction.Wait);
    expect(ShrewComponent.animTimer[entity]).toBeGreaterThanOrEqual(1);
    expect(ShrewComponent.animTimer[entity]).toBeLessThanOrEqual(8);
    expect(ShrewComponent.isClickable[entity]).toBe(0);
  });

  it("creates the configured 3x3 hole layout", () => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, [HoleEntity]);
    const holes = entities.createMany(
      HoleEntity,
      Array.from({ length: HOLE_COUNT }, (_, index) => ({
        index,
        mapType: MapType.Meadow,
      })),
    );

    expect(holes).toHaveLength(HOLE_COUNT);
    expect(holes.map((eid) => [HoleComponent.gridRow[eid], HoleComponent.gridCol[eid]])).toEqual([
      [0, 0], [0, 1], [0, 2],
      [1, 0], [1, 1], [1, 2],
      [2, 0], [2, 1], [2, 2],
    ]);
    expect(holes.map((eid) => HoleComponent.zIndex[eid])).toEqual([2, 2, 2, 4, 4, 4, 6, 6, 6]);

    holes.forEach((eid, index) => {
      expect(HoleComponent.posXRatio[eid]).toBeCloseTo(HolePositions[MapType.Meadow].xRatios[index], 5);
      expect(HoleComponent.posYRatio[eid]).toBeCloseTo(HolePositions[MapType.Meadow].yRatios[index], 5);
      expect(HoleComponent.residentEid[eid]).toBe(0);
      expect(HoleComponent.occupantEid[eid]).toBe(0);
    });
  });

  it("creates the scene singleton with complete defaults", () => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, [SceneEntity]);
    entities.bootstrapSingletons();
    const scene = entities.one(SceneEntity);

    expect({
      currentMap: SceneComponent.currentMap[scene],
      sceneTimer: SceneComponent.sceneTimer[scene],
      cycleInterval: SceneComponent.cycleInterval[scene],
      transitioning: SceneComponent.transitioning[scene],
    }).toEqual({
      currentMap: MapType.Meadow,
      sceneTimer: 0,
      cycleInterval: SCENE_CYCLE_INTERVAL,
      transitioning: 0,
    });
  });

  it("creates the player singleton with complete defaults", () => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, [PlayerEntity]);
    entities.bootstrapSingletons();
    const player = entities.one(PlayerEntity);

    expect({
      money: PlayerComponent.money[player],
      angry: PlayerComponent.angry[player],
      power: PlayerComponent.power[player],
      powerTop: PlayerComponent.powerTop[player],
      level: PlayerComponent.level[player],
    }).toEqual({
      money: 0,
      angry: 0,
      power: 0,
      powerTop: 0,
      level: 0,
    });
  });
});
