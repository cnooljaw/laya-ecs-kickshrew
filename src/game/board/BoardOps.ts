import { defineQuery } from "bitecs";
import { HolePositions, getHoleZOrder } from "./HolePositions";
import { HoleComponent, SceneComponent } from "./BoardComponents";
import type { BoardTopology } from "./BoardTopology";
import { BoardOccupantKind, type MapType } from "./BoardTypes";

const sceneQuery = defineQuery([SceneComponent]);
const holeQuery = defineQuery([HoleComponent]);

export function getCurrentMap(board: BoardTopology): MapType {
  return SceneComponent.currentMap[board.scene] as MapType;
}

/** Applies one map layout without changing resident or temporary occupant state. */
export function applyMapToBoard(world: any, mapType: MapType): void {
  const scenes = sceneQuery(world);
  if (scenes.length === 0) return;
  const positions = HolePositions[mapType];
  if (!positions) return;

  const scene = scenes[0];
  SceneComponent.currentMap[scene] = mapType;
  SceneComponent.transitioning[scene] = 1;

  const holes = holeQuery(world);
  for (let index = 0; index < holes.length; index++) {
    const eid = holes[index];
    const holeIndex = Math.round(HoleComponent.index[eid]);
    HoleComponent.posXRatio[eid] = positions.xRatios[holeIndex];
    HoleComponent.posYRatio[eid] = positions.yRatios[holeIndex];
    HoleComponent.zIndex[eid] = getHoleZOrder(HoleComponent.gridRow[eid]);
  }
}

export function getHoleEid(board: BoardTopology, index: number): number {
  const eid = board.holes[index];
  if (eid === undefined) throw new Error(`Board hole is not found: ${index}`);
  return eid;
}

export function getHoleIndex(holeEid: number): number {
  return Math.round(HoleComponent.index[holeEid]);
}

export function getHoleCenter(board: BoardTopology, index: number): { xRatio: number; yRatio: number } {
  const eid = getHoleEid(board, index);
  return {
    xRatio: HoleComponent.posXRatio[eid],
    yRatio: HoleComponent.posYRatio[eid],
  };
}

export function getBoardHoleZOrder(board: BoardTopology, index: number): number {
  return HoleComponent.zIndex[getHoleEid(board, index)];
}

export function bindResident(
  board: BoardTopology,
  index: number,
  kind: BoardOccupantKind,
  eid: number,
): void {
  const holeEid = getHoleEid(board, index);
  HoleComponent.residentKind[holeEid] = kind;
  HoleComponent.residentEid[holeEid] = eid;
  restoreResident(board, index);
}

function restoreResident(board: BoardTopology, index: number): void {
  const holeEid = getHoleEid(board, index);
  HoleComponent.occupantKind[holeEid] = HoleComponent.residentKind[holeEid];
  HoleComponent.occupantEid[holeEid] = HoleComponent.residentEid[holeEid];
}

export function canOccupyTriad(board: BoardTopology, triad: readonly [number, number, number]): boolean {
  return triad.every(index => {
    const holeEid = getHoleEid(board, index);
    return HoleComponent.occupantKind[holeEid] === HoleComponent.residentKind[holeEid]
      && HoleComponent.occupantEid[holeEid] === HoleComponent.residentEid[holeEid];
  });
}

export function tryOccupyTriad(
  board: BoardTopology,
  triad: readonly [number, number, number],
  kind: BoardOccupantKind,
  eid: number,
): boolean {
  if (!canOccupyTriad(board, triad)) return false;
  for (const index of triad) {
    const holeEid = getHoleEid(board, index);
    HoleComponent.occupantKind[holeEid] = kind;
    HoleComponent.occupantEid[holeEid] = eid;
  }
  return true;
}

function releaseTriad(board: BoardTopology, triad: readonly [number, number, number]): void {
  for (const index of triad) restoreResident(board, index);
}

export function releaseTriadIfOwned(
  board: BoardTopology,
  triad: readonly [number, number, number],
  kind: BoardOccupantKind,
  eid: number,
): boolean {
  const ownsAll = triad.every(index => {
    const holeEid = getHoleEid(board, index);
    return HoleComponent.occupantKind[holeEid] === kind
      && HoleComponent.occupantEid[holeEid] === eid;
  });
  if (!ownsAll) return false;

  releaseTriad(board, triad);
  return true;
}
