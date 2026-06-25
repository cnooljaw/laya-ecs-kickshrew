import { ShrewFeature } from "./features/shrew";
import type { FeatureManifest } from "../framework/feature/FeatureManifest";
import { createGameFeatureRegistry } from "../framework/feature/FeatureRegistry";
import { HammerFeature } from "./features/hammer";
import { MonsterFeature } from "./features/monster";
import { PerfHeroFeature } from "./features/perfHero";
import { PlayerHudFeature } from "./features/playerHud";
import { SessionFeature } from "./session";

export const GAME_FEATURES: readonly FeatureManifest[] = [
  ShrewFeature,
  HammerFeature,
  PlayerHudFeature,
  SessionFeature,
  PerfHeroFeature,
  MonsterFeature,
];

export const GAME_FEATURE_REGISTRY = createGameFeatureRegistry(GAME_FEATURES);
