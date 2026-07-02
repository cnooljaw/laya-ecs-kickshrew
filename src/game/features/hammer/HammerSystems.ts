/**
 * HammerSystem — 锤子系统
 *
 * 职责:
 * 1. 切换锤子类型
 * 2. 检查愤怒值触发雷神锤
 * 3. 雷神锤动画完成后恢复正常锤子
 * 4. 锤子动画结束后恢复 hitTable=1
 */
import { defineQuery } from "bitecs";
import { HAMMER_RULES } from "../../../config/GameTuning";
import { HammerComponent } from "./HammerComponents";
import { HammerType } from "./HammerTypes";

const hammerQuery = defineQuery([HammerComponent]);

/**
 * 锤子系统
 * @param world ECS 世界
 * @param switchTo 切换到的锤子类型 (可选)
 * @param thunderAnimDone 雷神锤动画是否完成
 * @param hitAnimDone 普通锤子击打动画是否完成 (恢复 hitTable)
 */
export function hammerSystem(
  world: any,
  switchTo?: number,
  thunderAnimDone: boolean = false,
  hitAnimDone: boolean = false,
  deltaSec: number = 0,
): void {
  const hammerEntities = hammerQuery(world);
  if (hammerEntities.length === 0) return;

  const hammerEid = hammerEntities[0];

  // 切换锤子类型
  if (switchTo !== undefined && HammerComponent.isThunderActive[hammerEid] !== 1) {
    HammerComponent.selectedType[hammerEid] = switchTo;
  }

  // 锤子击打动画完成 → 恢复 hitTable
  if (hitAnimDone && HammerComponent.hitTable[hammerEid] === 0) {
    HammerComponent.hitTable[hammerEid] = 1;
    HammerComponent.hitCooldownSec[hammerEid] = 0;
  }

  // 普通击打冷却结束 → 恢复 hitTable。不要恢复雷神锤锁定态。
  if (deltaSec > 0 && HammerComponent.hitCooldownSec[hammerEid] > 0) {
    HammerComponent.hitCooldownSec[hammerEid] = Math.max(0, HammerComponent.hitCooldownSec[hammerEid] - deltaSec);
    if (HammerComponent.hitCooldownSec[hammerEid] === 0 && HammerComponent.isThunderActive[hammerEid] !== 1) {
      HammerComponent.hitTable[hammerEid] = 1;
    }
  }

  // 雷神锤动画完成 → 恢复
  if (thunderAnimDone && HammerComponent.isThunderActive[hammerEid] === 1) {
    HammerComponent.isThunderActive[hammerEid] = 0;
    // 恢复到上一个使用的锤子类型（这里简化为 Gold）
    if (HammerComponent.selectedType[hammerEid] === HammerType.Thunder) {
      HammerComponent.selectedType[hammerEid] = HammerType.Gold;
    }
    HammerComponent.hitTable[hammerEid] = 1;
    HammerComponent.hitCooldownSec[hammerEid] = 0;
  }
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
