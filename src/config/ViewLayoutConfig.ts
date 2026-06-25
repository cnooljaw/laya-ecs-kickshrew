import { DESIGN_RESOLUTION } from "./GameTuning";

export const VIEWPORT = DESIGN_RESOLUTION;

export const SCENE_LAYOUT = {
  backgroundZOrder: -100,
  transitionMaskZOrder: 999,
  transitionFadeInMs: 300,
  transitionFadeOutMs: 300,
  transitionMaskColor: "#FFFFFF",
} as const;
