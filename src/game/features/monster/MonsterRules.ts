import { MonsterType } from "./MonsterTypes";

export interface MonsterSpawnRule {
  readonly slot: number;
  readonly monsterType: MonsterType;
  readonly maxActiveCount: number;
  readonly trigger: {
    readonly source: "money";
    readonly mode: "multiple";
    readonly interval: number;
    readonly catchUp: boolean;
  };
}

export const MONSTER_DURATION_SEC: Record<MonsterType, number> = {
  [MonsterType.Rhino]: 10,
};

export const MONSTER_TIMING = {
  dropSec: 0.45,
  dizzySec: 0.5,
} as const;

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

export function validateMonsterRules(
  rules: readonly MonsterSpawnRule[] = MONSTER_SPAWN_RULES,
): string[] {
  const issues: string[] = [];
  const usedSlots = new Set<number>();

  for (let index = 0; index < rules.length; index++) {
    const rule = rules[index];
    if (usedSlots.has(rule.slot)) {
      issues.push(`MONSTER_SPAWN_RULES slot 重复: ${rule.slot}`);
    }
    usedSlots.add(rule.slot);
    if (rule.maxActiveCount <= 0) {
      issues.push(`MONSTER_SPAWN_RULES[${index}].maxActiveCount 必须大于 0`);
    }
    if (rule.trigger.interval <= 0) {
      issues.push(`MONSTER_SPAWN_RULES[${index}].trigger.interval 必须大于 0`);
    }
    if (!MONSTER_DURATION_SEC[rule.monsterType]) {
      issues.push(`MONSTER_DURATION_SEC 缺少 monsterType=${rule.monsterType}`);
    }
  }
  return issues;
}
