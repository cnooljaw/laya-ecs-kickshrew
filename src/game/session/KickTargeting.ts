import { HIT_DETECTION } from "../../config/GameTuning";

export const enum KickHitTargetKind {
  None = 0,
  Shrew = 1,
  Monster = 2,
}

export interface KickTarget {
  readonly kind: KickHitTargetKind.Shrew | KickHitTargetKind.Monster;
  readonly eid: number;
  readonly xRatio: number;
  readonly yRatio: number;
  readonly holeIndex: number;
  readonly holeEid: number;
  readonly hitShrewType: number;
}

export interface KickTouchRatio {
  readonly xRatio: number;
  readonly yRatio: number;
}

export function findClosestKickTarget(
  targets: readonly KickTarget[],
  touch: KickTouchRatio,
): KickTarget | undefined {
  let closest: KickTarget | undefined;
  let closestDist = Infinity;

  for (const target of targets) {
    const dist = distanceToTarget(touch, target);
    if (dist >= HIT_DETECTION.radiusRatio || dist >= closestDist) continue;
    closest = target;
    closestDist = dist;
  }

  return closest;
}

function distanceToTarget(touch: KickTouchRatio, target: KickTarget): number {
  const dx = touch.xRatio - target.xRatio;
  const dy = touch.yRatio - target.yRatio;
  return Math.sqrt(dx * dx + dy * dy);
}
