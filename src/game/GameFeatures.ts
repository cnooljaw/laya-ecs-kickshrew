import { CoreGameplayFeature as ShrewFeature } from "../features/CoreGameplayFeature";
import type { GameFeature } from "../framework/feature/FeatureManifest";
import { createGameFeatureRegistry } from "../framework/feature/FeatureRegistry";
import { HammerFeature } from "../features/HammerFeature";
import { HudFeature as PlayerHudFeature } from "../features/HudFeature";
import { MonsterFeature } from "../features/MonsterFeature";
import { PerfHeroFeature } from "../features/PerfHeroFeature";

export const GAME_FEATURES: readonly GameFeature[] = [
  ShrewFeature,
  HammerFeature,
  PlayerHudFeature,
  PerfHeroFeature,
  MonsterFeature,
];

export const GAME_FEATURE_REGISTRY = createGameFeatureRegistry(GAME_FEATURES);
