import { ShrewComponent } from "../../game/features/shrew/ShrewComponents";
import { ShrewEntity } from "../../game/features/shrew/ShrewEntities";
import { syncShrewBoardPosition } from "../../game/features/shrew/ShrewBoardSyncSystem";
import { createEntityRuntime } from "../../framework/ecs/EntityRuntime";
import {
  bindResident,
  BoardOccupantKind,
  createBoardTopology,
  HOLE_COUNT,
  type MapType,
} from "../../game/board";
import { HoleComponent } from "../../game/board/BoardComponents";
import { HoleEntity } from "../../game/board/BoardEntities";
import { type ShrewType } from "../../game/features/shrew";
import { MonsterAction, MonsterType } from "../../game/features/monster";
import { MonsterComponent } from "../../game/features/monster/MonsterComponents";
import { MonsterEntity } from "../../game/features/monster/MonsterEntities";
import { spawnMonster } from "../../game/features/monster/MonsterPool";
import { type MonsterHoleTriad } from "../../game/features/monster/MonsterHoleTriads";

export function createShrewEntity(
  world: any,
  shrewType: ShrewType,
  mapType: MapType,
): number {
  return createEntityRuntime(world, [ShrewEntity]).create(ShrewEntity, {
    shrewType,
    mapType,
  });
}

export function createHoleEntities(world: any, mapType: MapType): number[] {
  return createEntityRuntime(world, [HoleEntity]).createMany(
    HoleEntity,
    Array.from({ length: HOLE_COUNT }, (_, index) => ({ index, mapType })),
  );
}

export function bindShrewToHoleForTest(holeEid: number, shrewEid: number): void {
  const board = createBoardTopology(0, [holeEid]);
  const holeIndex = Math.round(HoleComponent.index[holeEid]);
  bindResident(board, 0, BoardOccupantKind.Shrew, shrewEid);
  syncShrewBoardPosition(shrewEid, holeEid);
  // The local topology only knows one hole; restore the real board index on Shrew.
  ShrewComponent.holeIndex[shrewEid] = holeIndex;
}

export interface MonsterTriadTestOptions {
  readonly actionState?: MonsterAction;
  readonly hp?: number;
  readonly reward?: number;
}

export function createMonsterAtTriadForTest(
  world: any,
  holes: readonly number[],
  triad: MonsterHoleTriad,
  options: MonsterTriadTestOptions = {},
): number {
  const monster = createEntityRuntime(world, [MonsterEntity]).create(MonsterEntity, {
    monsterType: MonsterType.Rhino,
    posX: 0,
    posY: 0,
    durationSec: 10,
  });
  const board = createBoardTopology(0, holes);
  const spawned = spawnMonster(monster, MonsterType.Rhino, triad, board);
  if (!spawned) throw new Error(`Failed to spawn monster at triad: ${triad.join(",")}`);

  MonsterComponent.actionState[monster] = options.actionState ?? MonsterAction.Stay;
  if (options.hp !== undefined) MonsterComponent.hp[monster] = options.hp;
  if (options.reward !== undefined) MonsterComponent.reward[monster] = options.reward;
  return monster;
}
