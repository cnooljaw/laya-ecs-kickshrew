/**
 * HitResponseSystem — 处理击打回包数据
 *
 * 职责:
 * 1. 解析服务器回包(KickResponse)
 * 2. 更新玩家数据: money/angry/power/level
 * 3. 检查愤怒值触发雷神锤(angry>=1000 → isThunderActive=1)
 * 4. 更新锤子选中类型(hammerId)
 * 5. 更新连击数据(combo/comboId)
 * 6. 返回击中奖励列表(shrewResp)，由视图层播放动画
 */
import { defineQuery } from "bitecs";
import { PlayerComponent, HammerComponent, ComboComponent } from "../components";
import { HammerType } from "../types";

export interface KickShrewResponse {
  shrewIndex: number;
  reward: number;
}

export interface KickResponse {
  seqId: number;
  cmd: string;
  ret: number;
  money: number;
  angry: number;
  power: number;
  levelScore: number;
  hammerId: number;
  numOfShrew: number;
  shrewResp: KickShrewResponse[];
  combo: number;
  comboId: number;
}

const playerQuery = defineQuery([PlayerComponent]);
const hammerQuery = defineQuery([HammerComponent]);
const comboQuery = defineQuery([ComboComponent]);

/**
 * 处理击打回包
 * @param world ECS 世界
 * @param resp 服务器回包
 * @returns 击中奖励列表，供视图层使用
 */
export function hitResponseSystem(world: any, resp: KickResponse): KickShrewResponse[] {
  // ret != 0 时不更新
  if (resp.ret !== 0) return [];

  // 更新玩家数据
  const playerEntities = playerQuery(world);
  if (playerEntities.length > 0) {
    const eid = playerEntities[0];
    PlayerComponent.money[eid] += resp.money;
    PlayerComponent.angry[eid] = resp.angry;
    PlayerComponent.power[eid] += resp.power;
    PlayerComponent.level[eid] = resp.levelScore;
  }

  // 更新锤子数据
  const hammerEntities = hammerQuery(world);
  if (hammerEntities.length > 0) {
    const eid = hammerEntities[0];
    HammerComponent.selectedType[eid] = resp.hammerId;

    // 检查愤怒值触发雷神锤
    if (resp.angry >= 1000) {
      HammerComponent.isThunderActive[eid] = 1;
      HammerComponent.selectedType[eid] = HammerType.Thunder;
    }
  }

  // 更新连击数据
  const comboEntities = comboQuery(world);
  if (comboEntities.length > 0 && resp.combo > 0) {
    const eid = comboEntities[0];
    ComboComponent.comboCount[eid] = resp.combo;
    ComboComponent.comboID[eid] = resp.comboId;
  }

  return resp.shrewResp || [];
}
