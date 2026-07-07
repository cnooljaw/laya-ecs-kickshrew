import { beforeEach, describe, expect, it } from "vitest";
import { createEntityRuntime } from "../../../framework/ecs/EntityRuntime";
import { createGameWorld } from "../../../framework/ecs/GameWorld";
import {
  bindResident,
  BoardOccupantKind,
  createBoardTopology,
  getHoleEid,
  HOLE_COUNT,
  MapType,
  releaseTriadIfOwned,
  tryOccupyTriad,
  type BoardTopology,
} from "../../../game/board";
import { HoleComponent } from "../../../game/board/BoardComponents";
import { HoleEntity, SceneEntity } from "../../../game/board/BoardEntities";

describe("BoardOps", () => {
  let world: ReturnType<typeof createGameWorld>;
  let board: BoardTopology;

  beforeEach(() => {
    world = createGameWorld();
    const entities = createEntityRuntime(world, [SceneEntity, HoleEntity]);
    entities.bootstrapSingletons();
    const scene = entities.one(SceneEntity);
    const holes = entities.createMany(
      HoleEntity,
      Array.from({ length: HOLE_COUNT }, (_, index) => ({
        index,
        mapType: MapType.Meadow,
      })),
    );
    board = createBoardTopology(scene, holes);
  });

  it("原子占用可用三角形并返回成功", () => {
    const triad: readonly [number, number, number] = [0, 1, 3];
    for (const index of triad) {
      bindResident(board, index, BoardOccupantKind.Shrew, 1000 + index);
    }

    const occupied = tryOccupyTriad(board, triad, BoardOccupantKind.Monster, 2001);

    expect(occupied).toBe(true);
    for (const index of triad) {
      const hole = getHoleEid(board, index);
      expect(HoleComponent.occupantKind[hole]).toBe(BoardOccupantKind.Monster);
      expect(HoleComponent.occupantEid[hole]).toBe(2001);
    }
  });

  it("三角形任一洞已被临时占用时返回失败且不半写入", () => {
    const triad: readonly [number, number, number] = [0, 1, 3];
    for (const index of triad) {
      bindResident(board, index, BoardOccupantKind.Shrew, 1000 + index);
    }
    const blockedHole = getHoleEid(board, 1);
    HoleComponent.occupantKind[blockedHole] = BoardOccupantKind.Monster;
    HoleComponent.occupantEid[blockedHole] = 999;
    const before = snapshotOccupants(board, triad);

    const occupied = tryOccupyTriad(board, triad, BoardOccupantKind.Monster, 2001);

    expect(occupied).toBe(false);
    expect(snapshotOccupants(board, triad)).toEqual(before);
  });

  it("只释放指定占用者拥有的三角形，避免误清新的占用", () => {
    const triad: readonly [number, number, number] = [0, 1, 3];
    for (const index of triad) {
      bindResident(board, index, BoardOccupantKind.Shrew, 1000 + index);
    }
    tryOccupyTriad(board, triad, BoardOccupantKind.Monster, 2001);

    const releasedByWrongOwner = releaseTriadIfOwned(board, triad, BoardOccupantKind.Monster, 999);

    expect(releasedByWrongOwner).toBe(false);
    for (const index of triad) {
      const hole = getHoleEid(board, index);
      expect(HoleComponent.occupantKind[hole]).toBe(BoardOccupantKind.Monster);
      expect(HoleComponent.occupantEid[hole]).toBe(2001);
    }

    const releasedByOwner = releaseTriadIfOwned(board, triad, BoardOccupantKind.Monster, 2001);

    expect(releasedByOwner).toBe(true);
    for (const index of triad) {
      const hole = getHoleEid(board, index);
      expect(HoleComponent.occupantKind[hole]).toBe(BoardOccupantKind.Shrew);
      expect(HoleComponent.occupantEid[hole]).toBe(1000 + index);
    }
  });
});

function snapshotOccupants(
  board: BoardTopology,
  indices: readonly number[],
): Array<{ kind: number; eid: number }> {
  return indices.map(index => {
    const hole = getHoleEid(board, index);
    return {
      kind: HoleComponent.occupantKind[hole],
      eid: HoleComponent.occupantEid[hole],
    };
  });
}
