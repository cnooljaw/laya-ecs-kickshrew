import { getHoleCenter, type BoardTopology } from "../../board/index";

export type MonsterHoleTriad = readonly [number, number, number];

export const MONSTER_HOLE_TRIADS: readonly MonsterHoleTriad[] = [
  [0, 1, 3], [0, 1, 4], [0, 3, 4], [1, 3, 4],
  [1, 2, 4], [1, 2, 5], [1, 4, 5], [2, 4, 5],
  [3, 4, 6], [3, 4, 7], [3, 6, 7], [4, 6, 7],
  [4, 5, 7], [4, 5, 8], [4, 7, 8], [5, 7, 8],
];

export function getMonsterTriadCenter(
  triad: MonsterHoleTriad,
  board: BoardTopology,
): { xRatio: number; yRatio: number } {
  let xRatio = 0;
  let yRatio = 0;
  for (const holeIndex of triad) {
    const center = getHoleCenter(board, holeIndex);
    xRatio += center.xRatio;
    yRatio += center.yRatio;
  }
  return {
    xRatio: xRatio / triad.length,
    yRatio: yRatio / triad.length,
  };
}
