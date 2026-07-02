import {
  ShrewComponent,
  ShrewEntity,
  syncShrewBoardPosition,
} from "../../game/features/shrew";
import { createEntityRuntime } from "../../framework/ecs/EntityRuntime";
import {
  BoardOccupantKind,
  BoardRuntime,
  HOLE_COUNT,
  HoleComponent,
  HoleEntity,
  type MapType,
} from "../../game/features/board";
import { type ShrewType } from "../../game/features/shrew";
import {
  MonsterAction,
  MonsterComponent,
  MonsterEntity,
  MonsterType,
  spawnMonster,
  type MonsterHoleTriad,
} from "../../game/features/monster";

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
  const board = new BoardRuntime(0, [holeEid]);
  const holeIndex = Math.round(HoleComponent.index[holeEid]);
  board.bindResident(0, BoardOccupantKind.Shrew, shrewEid);
  syncShrewBoardPosition(shrewEid, holeEid);
  // BoardRuntime only knows the local one-hole array; restore the real board index on Shrew.
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
  const board = new BoardRuntime(0, holes);
  const spawned = spawnMonster(monster, MonsterType.Rhino, triad, board);
  if (!spawned) throw new Error(`Failed to spawn monster at triad: ${triad.join(",")}`);

  MonsterComponent.actionState[monster] = options.actionState ?? MonsterAction.Stay;
  if (options.hp !== undefined) MonsterComponent.hp[monster] = options.hp;
  if (options.reward !== undefined) MonsterComponent.reward[monster] = options.reward;
  return monster;
}
