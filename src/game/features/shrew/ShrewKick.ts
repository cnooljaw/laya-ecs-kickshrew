import { defineQuery } from "bitecs";
import { BoardOccupantKind } from "../../board/index";
import {
  BoardPositionComponent,
  HoleComponent,
  ShrewComponent,
  AnimationComponent,
} from "./ShrewComponents";
import { startShrewDizzyHold } from "./ShrewLifecycle";
import { AnimType, ShrewAction, ShrewType } from "./ShrewTypes";

export interface ShrewKickTarget {
  readonly eid: number;
  readonly holeIndex: number;
  readonly holeEid: number;
  readonly xRatio: number;
  readonly yRatio: number;
  readonly shrewType: number;
}

export interface ShrewLocalHitResult {
  readonly hitShrewType: number;
  readonly actionState: number;
  readonly actionStateName: string;
  readonly animType: number;
  readonly animTypeName: string;
  readonly dizzyTriggered: boolean;
  readonly isClickable: number;
  readonly hp: number;
}

const holeQuery = defineQuery([HoleComponent]);
const shrewQuery = defineQuery([ShrewComponent, BoardPositionComponent]);

export function collectShrewKickTargets(world: any): ShrewKickTarget[] {
  const targets: ShrewKickTarget[] = [];
  const shrews = shrewQuery(world);
  for (let i = 0; i < shrews.length; i++) {
    const eid = shrews[i];
    if (ShrewComponent.isClickable[eid] !== 1) continue;
    const hole = findCurrentShrewHole(world, eid);
    if (!hole) continue;
    targets.push({
      eid,
      holeIndex: hole.index,
      holeEid: hole.eid,
      xRatio: BoardPositionComponent.xRatio[eid],
      yRatio: BoardPositionComponent.yRatio[eid],
      shrewType: ShrewComponent.shrewType[eid],
    });
  }
  return targets;
}

export function applyShrewLocalHit(shrewEid: number): ShrewLocalHitResult {
  const shrewType = ShrewComponent.shrewType[shrewEid] as ShrewType;
  ShrewComponent.hp[shrewEid] -= 1;
  startShrewDizzyHold(shrewEid);

  if (shrewType === ShrewType.Blue && ShrewComponent.hasHat[shrewEid] === 1 && ShrewComponent.hp[shrewEid] > 0) {
    ShrewComponent.hasHat[shrewEid] = 0;
  }

  const actionState = ShrewComponent.actionState[shrewEid];
  const animType = AnimationComponent.animType[shrewEid];
  return {
    hitShrewType: shrewType,
    actionState,
    actionStateName: shrewActionName(actionState),
    animType,
    animTypeName: shrewAnimTypeName(animType),
    dizzyTriggered: actionState === ShrewAction.Dizzy,
    isClickable: ShrewComponent.isClickable[shrewEid],
    hp: ShrewComponent.hp[shrewEid],
  };
}

function findCurrentShrewHole(world: any, shrewEid: number): { eid: number; index: number } | undefined {
  const holes = holeQuery(world);
  const expectedIndex = Math.round(ShrewComponent.holeIndex[shrewEid]);
  for (let i = 0; i < holes.length; i++) {
    const holeEid = holes[i];
    if (Math.round(HoleComponent.index[holeEid]) !== expectedIndex) continue;
    if (HoleComponent.occupantKind[holeEid] !== BoardOccupantKind.Shrew) continue;
    if (HoleComponent.occupantEid[holeEid] !== shrewEid) continue;
    return { eid: holeEid, index: expectedIndex };
  }
  return undefined;
}

function shrewActionName(actionState: number): string {
  switch (actionState) {
    case ShrewAction.Wait: return "Wait";
    case ShrewAction.Up: return "Up";
    case ShrewAction.Stand: return "Stand";
    case ShrewAction.Down: return "Down";
    case ShrewAction.Dizzy: return "Dizzy";
    default: return String(actionState);
  }
}

function shrewAnimTypeName(animType: number): string {
  switch (animType) {
    case AnimType.Idle: return "Idle";
    case AnimType.Up: return "Up";
    case AnimType.Stand: return "Stand";
    case AnimType.Down: return "Down";
    case AnimType.Dizzy: return "Dizzy";
    case AnimType.HatBreak: return "HatBreak";
    case AnimType.Swelling: return "Swelling";
    case AnimType.HammerEffect: return "HammerEffect";
    case AnimType.TreasureBox: return "TreasureBox";
    default: return String(animType);
  }
}
