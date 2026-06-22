import type { GameFeature } from "./GameFeature";
import { MonsterFeature } from "./monster/MonsterFeature";

export const GAME_FEATURES: readonly GameFeature[] = [
  MonsterFeature,
];
