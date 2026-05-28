/**
 * MockServer — 本地模拟服务器回包
 *
 * 职责:
 * 1. 收到 kick 请求后，原样返回 seqId
 * 2. 根据击中地鼠类型计算奖励（蓝鼠双倍）
 * 3. 随机增加愤怒值（10~30）
 * 4. 生成模拟 KickResponse
 *
 * 后续可替换为真实服务器连接
 */
import type { KickRequest, KickResponse } from "./ProtocolTypes";
import { MOCK_SERVER_TUNING } from "../config/GameTuning";

export class MockServer {
  private _angryAccum: number = 0;

  /**
   * 处理击打请求，生成模拟回包
   */
  handleKick(req: KickRequest): KickResponse {
    if (req.bKickShrew === 0 || req.numOfShrew === 0) {
      return this.emptyResponse(req);
    }

    const shrewResp = req.shrews.map(s => {
      // 蓝鼠(shrewindex=2)双倍奖励
      const reward = s.protectType === 1
        ? MOCK_SERVER_TUNING.baseReward * MOCK_SERVER_TUNING.bossRewardMultiplier
        : MOCK_SERVER_TUNING.baseReward;
      return { shrewIndex: s.shrewindex, reward };
    });

    const totalReward = shrewResp.reduce((sum, s) => sum + s.reward, 0);
    const angryGain = this.randomRange(MOCK_SERVER_TUNING.angryGainMin, MOCK_SERVER_TUNING.angryGainMax);
    this._angryAccum += angryGain;

    return {
      seqId: req.seqId,
      cmd: 'kickResult',
      ret: 0,
      money: totalReward,
      angry: this._angryAccum,
      power: this.randomRange(MOCK_SERVER_TUNING.powerGainMin, MOCK_SERVER_TUNING.powerGainMax),
      levelScore: totalReward * MOCK_SERVER_TUNING.levelScoreRewardMultiplier,
      hammerId: req.hammerType,
      numOfShrew: req.numOfShrew,
      shrewResp,
      combo: 0,
      comboId: req.comboID,
    };
  }

  /** 未击中的空回包 */
  private emptyResponse(req: KickRequest): KickResponse {
    return {
      seqId: req.seqId,
      cmd: 'kickResult',
      ret: 0,
      money: 0,
      angry: this._angryAccum,
      power: 0,
      levelScore: 0,
      hammerId: req.hammerType,
      numOfShrew: 0,
      shrewResp: [],
      combo: 0,
      comboId: 0,
    };
  }

  private randomRange(min: number, max: number): number {
    return min + Math.floor(Math.random() * (max - min + 1));
  }
}
