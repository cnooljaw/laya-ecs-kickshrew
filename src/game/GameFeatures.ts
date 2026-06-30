import { BoardFeature } from "./features/board";
import { ShrewFeature } from "./features/shrew";
import type { FeatureManifest } from "../framework/feature/FeatureManifest";
import { createGameFeatureRegistry } from "../framework/feature/FeatureRegistry";
import { HammerFeature } from "./features/hammer";
import { MonsterFeature } from "./features/monster";
import { PerfHeroFeature } from "./features/perfHero";
import { PlayerHUDFeature } from "./features/playerHud";
import { SessionFeature } from "./session";

export const GAME_FEATURES: readonly FeatureManifest[] = [
  BoardFeature,
  ShrewFeature,
  HammerFeature,
  PlayerHUDFeature,
  SessionFeature,
  PerfHeroFeature,
  MonsterFeature,
];

export const GAME_FEATURE_REGISTRY = createGameFeatureRegistry(GAME_FEATURES);
