import { defineQuery } from "bitecs";
import { HAMMER_RULES } from "../../../config/GameTuning";
import { HammerComponent } from "./HammerComponents";
import { HammerType } from "./HammerTypes";

const hammerQuery = defineQuery([HammerComponent]);

/** Advances the ordinary hammer cooldown once per frame. */
export function advanceHammerCooldownSystem(world: any, deltaSec: number): void {
  const hammerEntities = hammerQuery(world);
  if (hammerEntities.length === 0) return;

  const hammerEid = hammerEntities[0];
  if (deltaSec > 0 && HammerComponent.hitCooldownSec[hammerEid] > 0) {
    HammerComponent.hitCooldownSec[hammerEid] = Math.max(0, HammerComponent.hitCooldownSec[hammerEid] - deltaSec);
    if (HammerComponent.hitCooldownSec[hammerEid] === 0 && HammerComponent.isThunderActive[hammerEid] !== 1) {
      HammerComponent.hitTable[hammerEid] = 1;
    }
  }
}

export function selectHammer(hammerEid: number, hammerType: number): void {
  if (HammerComponent.isThunderActive[hammerEid] === 1) return;
  HammerComponent.selectedType[hammerEid] = hammerType;
}

export function completeHammerHitAnimation(hammerEid: number): void {
  if (HammerComponent.isThunderActive[hammerEid] === 1) return;
  HammerComponent.hitTable[hammerEid] = 1;
  HammerComponent.hitCooldownSec[hammerEid] = 0;
}

export function completeHammerThunderAnimation(hammerEid: number): void {
  if (HammerComponent.isThunderActive[hammerEid] !== 1) return;
  HammerComponent.isThunderActive[hammerEid] = 0;
  if (HammerComponent.selectedType[hammerEid] === HammerType.Thunder) {
    HammerComponent.selectedType[hammerEid] = HammerType.Gold;
  }
  HammerComponent.hitTable[hammerEid] = 1;
  HammerComponent.hitCooldownSec[hammerEid] = 0;
}

export function findHammer(world: any): number | undefined {
  return hammerQuery(world)[0];
}

export function applyHammerKickResponse(
  hammerEid: number,
  response: { readonly hammerId: number },
): void {
  HammerComponent.selectedType[hammerEid] = response.hammerId;
}

export interface HammerHitStatus {
  readonly canHit: boolean;
  readonly hitTable: number;
  readonly hitCooldownSec: number;
  readonly hammerType: number;
}

export function getHammerHitStatus(hammerEid: number): HammerHitStatus {
  const hitTable = HammerComponent.hitTable[hammerEid];
  return {
    canHit: hitTable === 1,
    hitTable,
    hitCooldownSec: HammerComponent.hitCooldownSec[hammerEid],
    hammerType: HammerComponent.selectedType[hammerEid],
  };
}

export function recordHammerFeedback(hammerEid: number, x: number, y: number): void {
  HammerComponent.touchX[hammerEid] = x;
  HammerComponent.touchY[hammerEid] = y;
  HammerComponent.hitSeq[hammerEid] += 1;
}

export function startHammerHitCooldown(hammerEid: number): void {
  HammerComponent.hitTable[hammerEid] = 0;
  HammerComponent.hitCooldownSec[hammerEid] = HAMMER_RULES.hitCooldownSec;
}

export function activateHammerThunder(hammerEid: number): void {
  HammerComponent.isThunderActive[hammerEid] = 1;
  HammerComponent.selectedType[hammerEid] = HammerType.Thunder;
  HammerComponent.hitTable[hammerEid] = 0;
  HammerComponent.hitCooldownSec[hammerEid] = 0;
}

export function isHammerThunderActive(hammerEid: number): boolean {
  return HammerComponent.isThunderActive[hammerEid] === 1;
}
