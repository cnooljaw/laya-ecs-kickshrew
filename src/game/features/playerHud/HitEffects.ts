import { defineEffect } from "../../../framework/sync/EffectDefinition";

export interface HitRewardPayload {
  shrewIndex: number;
  reward: number;
}

export const HitRewardEffect = defineEffect<HitRewardPayload>("hitReward");
export const HitMissEffect = defineEffect<void>("hitMiss");
