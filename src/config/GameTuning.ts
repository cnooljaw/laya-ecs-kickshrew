/**
 * GameTuning — gameplay/protocol tuning shared by ECS, networking, and runtime adapters.
 *
 * Keep visual-only layout numbers in ViewLayoutConfig.
 */

export const DESIGN_RESOLUTION = {
  width: 960,
  height: 640,
} as const;

export const HIT_DETECTION = {
  radiusRatio: 0.15,
} as const;

export const HAMMER_RULES = {
  thunderAngryThreshold: 1000,
  hitCooldownSec: 0.24,
} as const;

export const HOLE_PROTOCOL = {
  clientIndexOffset: 1,
} as const;

export const MOCK_SERVER_TUNING = {
  baseReward: 50,
  bossRewardMultiplier: 2,
  angryGainMin: 10,
  angryGainMax: 30,
  powerGainMin: 1,
  powerGainMax: 5,
  levelScoreRewardMultiplier: 2,
} as const;
