import { BoardFoundation } from "./board/assembly";
import { ShrewFeature } from "./features/shrew/assembly";
import type { FeatureManifest } from "../framework/feature/FeatureManifest";
import { createGameFeatureRegistry } from "../framework/feature/FeatureRegistry";
import { HammerFeature } from "./features/hammer/assembly";
import { MonsterFeature } from "./features/monster/assembly";
import { PerfHeroFeature } from "./features/perfHero/assembly";
import { PlayerHUDFeature } from "./features/playerHud/assembly";
import { GAME_SESSION_SYSTEMS, setupGameSession } from "./session";

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
  sessionSetup: setupGameSession,
  systems: GAME_SESSION_SYSTEMS,
});
