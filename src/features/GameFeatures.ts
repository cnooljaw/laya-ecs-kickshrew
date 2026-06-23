import type { GameFeature } from "./GameFeature";
import { createGameFeatureRegistry } from "./GameFeatureRegistry";
import { CoreGameplayFeature } from "./CoreGameplayFeature";
import { HammerFeature } from "./HammerFeature";
import { HudFeature } from "./HudFeature";
import { MonsterFeature } from "./MonsterFeature";
import { PerfHeroFeature } from "./PerfHeroFeature";

export const GAME_FEATURES: readonly GameFeature[] = [
  CoreGameplayFeature,
  HammerFeature,
  HudFeature,
  PerfHeroFeature,
  MonsterFeature,
];

export const GAME_FEATURE_REGISTRY = createGameFeatureRegistry(GAME_FEATURES);
