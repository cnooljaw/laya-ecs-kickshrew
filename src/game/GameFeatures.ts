import { CoreGameplayFeature as ShrewFeature } from "../features/CoreGameplayFeature";
import type { FeatureManifest } from "../framework/feature/FeatureManifest";
import { createGameFeatureRegistry } from "../framework/feature/FeatureRegistry";
import { HammerFeature } from "../features/HammerFeature";
import { HudFeature as PlayerHudFeature } from "../features/HudFeature";
import { MonsterFeature } from "./features/monster";
import { PerfHeroFeature } from "./features/perfHero";

export const GAME_FEATURES: readonly FeatureManifest[] = [
  ShrewFeature,
  HammerFeature,
  PlayerHudFeature,
  PerfHeroFeature,
  MonsterFeature,
];

export const GAME_FEATURE_REGISTRY = createGameFeatureRegistry(GAME_FEATURES);
