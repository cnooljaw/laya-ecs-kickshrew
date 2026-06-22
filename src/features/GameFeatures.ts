import type { GameFeature } from "./GameFeature";
import { createGameFeatureRegistry } from "./GameFeatureRegistry";
import { MonsterFeature } from "./monster/MonsterFeature";

export const GAME_FEATURES: readonly GameFeature[] = [
  MonsterFeature,
];

export const GAME_FEATURE_REGISTRY = createGameFeatureRegistry(GAME_FEATURES);
