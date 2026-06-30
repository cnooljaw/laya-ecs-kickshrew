export const PLAYER_HUD_VIEW_CONFIG = {
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

export const HIT_EFFECT_VIEW_CONFIG = {
  zOrder: 2100,
} as const;
