import { DESIGN_RESOLUTION } from "./GameTuning";

export const VIEWPORT = DESIGN_RESOLUTION;

export const SCENE_LAYOUT = {
  backgroundZOrder: -100,
  transitionMaskZOrder: 999,
  transitionFadeInMs: 300,
  transitionFadeOutMs: 300,
  transitionMaskColor: "#FFFFFF",
} as const;

export const PLAYER_HUD_LAYOUT = {
  zOrder: 100,
  x: 10,
  y: 10,
  lineHeight: 26,
  fontSize: 20,
  colors: {
    money: "#FFD700",
    angry: "#FF4444",
    power: "#44FF44",
    level: "#FFFFFF",
  },
} as const;

export const HAMMER_VIEW_LAYOUT = {
  zOrder: 10000,
  hitSwingDeg: 30,
  hitTweenMs: 80,
  hitSecondTweenDelayMs: 80,
} as const;

export const SHREW_VIEW_LAYOUT = {
  hiddenOffsetRatio: 0.52,
  dizzyStarZOrder: 200,
  dizzyStarRadius: 22,
  dizzyStarYOffsetRatio: 0.48,
  dizzySwingDeg: 4,
  dizzyTweenMs: 80,
} as const;

export const COMBO_VIEW_LAYOUT = {
  zOrder: 2000,
  color: "#FFD700",
  fontSize: 48,
  x: 375,
  y: 500,
  anchorX: 0.5,
  anchorY: 0.5,
  visibleMs: 1500,
} as const;

export const HIT_EFFECT_VIEW_LAYOUT = {
  zOrder: 2100,
} as const;
