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
import { HammerComponent, PlayerComponent } from "../components";
import { HammerType } from "../types";
import { HAMMER_RULES } from "../../config/GameTuning";

const hammerQuery = defineQuery([HammerComponent]);
const playerQuery = defineQuery([PlayerComponent]);

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

  // 检查雷神锤触发
  const playerEntities = playerQuery(world);
  if (playerEntities.length > 0 && HammerComponent.isThunderActive[hammerEid] !== 1) {
    const playerEid = playerEntities[0];
    if (PlayerComponent.angry[playerEid] >= HAMMER_RULES.thunderAngryThreshold) {
      HammerComponent.isThunderActive[hammerEid] = 1;
      HammerComponent.selectedType[hammerEid] = HammerType.Thunder;
      HammerComponent.hitTable[hammerEid] = 0;
      HammerComponent.hitCooldownSec[hammerEid] = 0;
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
