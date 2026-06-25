export const PERF_HERO_RESOURCES = [
  { name: "DestructionWarlock", skUrl: "resources/heros/DestructionWarlock.sk" },
  { name: "Ranger", skUrl: "resources/heros/Ranger.sk" },
  { name: "beila_girl", skUrl: "resources/heros/beila_girl.sk" },
] as const;

export const PERF_HERO_VIEW_CONFIG = {
  zOrder: 9000,
  defaultCount: 80,
  maxCount: 500,
  edgeBandSize: 120,
  marginX: 50,
  marginY: 44,
  minScale: 0.28,
  maxScale: 0.46,
} as const;
