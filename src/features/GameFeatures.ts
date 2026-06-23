import type { GameFeature } from "./GameFeature";
import { createGameFeatureRegistry } from "./GameFeatureRegistry";
import { CoreGameplayFeature } from "./core/CoreGameplayFeature";
import { HammerFeature } from "./hammer/HammerFeature";
import { HudFeature } from "./hud/HudFeature";
import { MonsterFeature } from "./monster/MonsterFeature";
import { PerfHeroFeature } from "./perfHero/PerfHeroFeature";

export const GAME_FEATURES: readonly GameFeature[] = [
  CoreGameplayFeature,
  HammerFeature,
  HudFeature,
  PerfHeroFeature,
  MonsterFeature,
];

export const GAME_FEATURE_REGISTRY = createGameFeatureRegistry(GAME_FEATURES);
