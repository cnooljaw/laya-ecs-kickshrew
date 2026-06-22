import { DESIGN_RESOLUTION } from "../../config/GameTuning";
import { MonsterType } from "./MonsterTypes";

export interface MonsterResourceConfig {
  skUrl: string;
  pngUrl: string;
  durationSec: number;
  scale: number;
  posX: number;
  posY: number;
}

export interface MonsterSpawnRule {
  slot: 0 | 1 | 2 | 3;
  monsterType: MonsterType;
  maxActiveCount: number;
  trigger: {
    source: "money";
    mode: "multiple";
    interval: number;
    catchUp: boolean;
  };
}

export const MONSTER_CONFIG: Record<MonsterType, MonsterResourceConfig> = {
  [MonsterType.Rhino]: {
    skUrl: "resources/monster/rhino.sk",
    pngUrl: "resources/monster/rhino.png",
    durationSec: 10,
    scale: 1,
    posX: DESIGN_RESOLUTION.width * 0.5,
    posY: DESIGN_RESOLUTION.height * 0.55,
  },
};

export const MONSTER_SPAWN_RULES: readonly MonsterSpawnRule[] = [
  {
    slot: 0,
    monsterType: MonsterType.Rhino,
    maxActiveCount: 1,
    trigger: {
      source: "money",
      mode: "multiple",
      interval: 100,
      catchUp: false,
    },
  },
];
