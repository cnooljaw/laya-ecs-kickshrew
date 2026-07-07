import { describe, expect, it } from "vitest";
import { createEntityRuntime } from "../../../../framework/ecs/EntityRuntime";
import { createGameWorld } from "../../../../framework/ecs/GameWorld";
import {
  createBoardTopology,
  MapType,
} from "../../../../game/board";
import { HoleComponent } from "../../../../game/board/BoardComponents";
import { HoleEntity, SceneEntity } from "../../../../game/board/BoardEntities";
import {
  getMonsterTriadCenter,
  MONSTER_HOLE_TRIADS,
} from "../../../../game/features/monster/MonsterHoleTriads";

describe("Monster triads", () => {
  it("defines all adjacent 3-hole triangle combinations in the 3x3 board", () => {
    expect(MONSTER_HOLE_TRIADS).toEqual([
      [0, 1, 3], [0, 1, 4], [0, 3, 4], [1, 3, 4],
      [1, 2, 4], [1, 2, 5], [1, 4, 5], [2, 4, 5],
      [3, 4, 6], [3, 4, 7], [3, 6, 7], [4, 6, 7],
      [4, 5, 7], [4, 5, 8], [4, 7, 8], [5, 7, 8],
    ]);
  });

  it("places monster at the center of its occupied triangle", () => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, [SceneEntity, HoleEntity]);
    entities.bootstrapSingletons();
    const scene = entities.one(SceneEntity);
    const holes = entities.createMany(
      HoleEntity,
      Array.from({ length: 9 }, (_, index) => ({ index, mapType: MapType.Meadow })),
    );
    const board = createBoardTopology(scene, holes);

    const center = getMonsterTriadCenter([0, 1, 3], board);

    expect(center.xRatio).toBeCloseTo(
      (HoleComponent.posXRatio[holes[0]]
        + HoleComponent.posXRatio[holes[1]]
        + HoleComponent.posXRatio[holes[3]]) / 3,
      5,
    );
    expect(center.yRatio).toBeCloseTo(
      (HoleComponent.posYRatio[holes[0]]
        + HoleComponent.posYRatio[holes[1]]
        + HoleComponent.posYRatio[holes[3]]) / 3,
      5,
    );
  });
});
