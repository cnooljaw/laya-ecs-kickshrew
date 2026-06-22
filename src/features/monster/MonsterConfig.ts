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

export function validateMonsterConfig(
  config: Partial<Record<MonsterType, MonsterResourceConfig>> = MONSTER_CONFIG,
  rules: readonly MonsterSpawnRule[] = MONSTER_SPAWN_RULES,
): string[] {
  const issues: string[] = [];
  const usedSlots = new Set<number>();

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    if (usedSlots.has(rule.slot)) {
      issues.push(`MONSTER_SPAWN_RULES slot 重复: ${rule.slot}`);
    }
    usedSlots.add(rule.slot);

    if (rule.maxActiveCount <= 0) {
      issues.push(`MONSTER_SPAWN_RULES[${i}].maxActiveCount 必须大于 0`);
    }

    const resource = config[rule.monsterType];
    if (!resource) {
      issues.push(`MONSTER_CONFIG 缺少 monsterType=${rule.monsterType} 的资源配置`);
    } else {
      if (!resource.skUrl) issues.push(`MONSTER_CONFIG[${rule.monsterType}].skUrl 不能为空`);
      if (!resource.pngUrl) issues.push(`MONSTER_CONFIG[${rule.monsterType}].pngUrl 不能为空`);
      if (resource.durationSec <= 0) issues.push(`MONSTER_CONFIG[${rule.monsterType}].durationSec 必须大于 0`);
      if (resource.scale <= 0) issues.push(`MONSTER_CONFIG[${rule.monsterType}].scale 必须大于 0`);
    }

    if (rule.trigger.interval <= 0) {
      issues.push(`MONSTER_SPAWN_RULES[${i}].trigger.interval 必须大于 0`);
    }
  }

  return issues;
}

export function assertValidMonsterConfig(
  config: Partial<Record<MonsterType, MonsterResourceConfig>> = MONSTER_CONFIG,
  rules: readonly MonsterSpawnRule[] = MONSTER_SPAWN_RULES,
): void {
  const issues = validateMonsterConfig(config, rules);
  if (issues.length > 0) {
    throw new Error(`Monster 配置无效:\n${issues.join("\n")}`);
  }
}
