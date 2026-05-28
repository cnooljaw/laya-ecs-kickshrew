import { AnimationComponent, ShrewComponent } from "./components";
import { AnimType, ShrewAction, ShrewType } from "./types";
import { SHREW_TIMING } from "../config/GameTuning";

export function resetShrewForNextCycle(eid: number): void {
  const shrewType = ShrewComponent.shrewType[eid] as ShrewType;
  ShrewComponent.hp[eid] = shrewType === ShrewType.Blue ? 2 : 1;
  ShrewComponent.hasHat[eid] = shrewType === ShrewType.Blue ? 1 : 0;
  ShrewComponent.actionState[eid] = ShrewAction.Wait;
  ShrewComponent.isClickable[eid] = 0;
  ShrewComponent.animTimer[eid] = randomRange(SHREW_TIMING.waitMinSec, SHREW_TIMING.waitMaxSec);

  AnimationComponent.animType[eid] = AnimType.Idle;
  AnimationComponent.progress[eid] = 0;
  AnimationComponent.duration[eid] = 0;
}

export function startShrewDizzyHold(eid: number): void {
  ShrewComponent.actionState[eid] = ShrewAction.Dizzy;
  ShrewComponent.isClickable[eid] = 0;
  ShrewComponent.animTimer[eid] = SHREW_TIMING.dizzyHoldSec;

  AnimationComponent.animType[eid] = AnimType.Dizzy;
  AnimationComponent.progress[eid] = 0;
  AnimationComponent.duration[eid] = 0;
}

/** 随机范围 [min, max] */
function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
