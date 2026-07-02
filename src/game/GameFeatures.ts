import { BoardFoundation } from "./board";
import { ShrewFeature } from "./features/shrew";
import type { FeatureManifest } from "../framework/feature/FeatureManifest";
import { createGameFeatureRegistry } from "../framework/feature/FeatureRegistry";
import { HammerFeature } from "./features/hammer";
import { MonsterFeature } from "./features/monster";
import { PerfHeroFeature } from "./features/perfHero";
import { PlayerHUDFeature } from "./features/playerHud";
import { GAME_SESSION_SYSTEMS } from "./session";

export const GAME_FOUNDATIONS: readonly FeatureManifest[] = [
  BoardFoundation,
];

export const GAME_FEATURES: readonly FeatureManifest[] = [
  MonsterFeature,
  ShrewFeature,
  HammerFeature,
  PlayerHUDFeature,
  PerfHeroFeature,
];

export const GAME_MODULES: readonly FeatureManifest[] = [
  ...GAME_FOUNDATIONS,
  ...GAME_FEATURES,
];

export const GAME_FEATURE_REGISTRY = createGameFeatureRegistry(GAME_MODULES, {
  systems: GAME_SESSION_SYSTEMS,
});
