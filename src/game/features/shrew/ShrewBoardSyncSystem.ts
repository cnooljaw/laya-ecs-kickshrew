import { defineQuery } from "bitecs";
import { BoardPositionComponent, HoleComponent, ShrewComponent } from "./ShrewComponents";
import { BoardOccupantKind } from "../board/index";
import { ShrewAction } from "./ShrewTypes";

const shrewQuery = defineQuery([ShrewComponent, BoardPositionComponent]);
const holeQuery = defineQuery([HoleComponent]);

export function shrewBoardSyncSystem(world: any): void {
  const holes = holeQuery(world);
  const shrews = shrewQuery(world);
  for (let i = 0; i < shrews.length; i++) {
    const shrewEid = shrews[i];
    const holeEid = findHoleByIndex(holes, ShrewComponent.holeIndex[shrewEid]);
    if (holeEid < 0) continue;
    syncShrewBoardPosition(shrewEid, holeEid);
    syncShrewOccupancyVisibility(shrewEid, holeEid);
  }
}

export function syncShrewBoardPosition(shrewEid: number, holeEid: number): void {
  BoardPositionComponent.xRatio[shrewEid] = HoleComponent.posXRatio[holeEid];
  BoardPositionComponent.yRatio[shrewEid] = HoleComponent.posYRatio[holeEid];
  BoardPositionComponent.zIndex[shrewEid] = HoleComponent.zIndex[holeEid];
}

function syncShrewOccupancyVisibility(shrewEid: number, holeEid: number): void {
  const isCurrentOccupant = HoleComponent.occupantKind[holeEid] === BoardOccupantKind.Shrew
    && HoleComponent.occupantEid[holeEid] === shrewEid;
  ShrewComponent.blockedByOccupant[shrewEid] = isCurrentOccupant ? 0 : 1;
  if (isCurrentOccupant) return;
  ShrewComponent.actionState[shrewEid] = ShrewAction.Wait;
  ShrewComponent.isClickable[shrewEid] = 0;
}

function findHoleByIndex(holes: readonly number[], holeIndex: number): number {
  for (let i = 0; i < holes.length; i++) {
    const holeEid = holes[i];
    if (HoleComponent.index[holeEid] === holeIndex) return holeEid;
  }
  return -1;
}
