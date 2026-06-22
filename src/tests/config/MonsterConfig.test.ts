import { describe, expect, it } from "vitest";
import {
  MONSTER_CONFIG,
  MONSTER_SPAWN_RULES,
  validateMonsterConfig,
  type MonsterSpawnRule,
} from "../../config/MonsterConfig";
import { MonsterType } from "../../ecs/gameplay/monster/MonsterTypes";

describe("MonsterConfig", () => {
  it("默认 Rhino 配置通过校验", () => {
    expect(validateMonsterConfig(MONSTER_CONFIG, MONSTER_SPAWN_RULES)).toEqual([]);
  });

  it("发现重复 slot、无效数量、无效触发间隔和缺失资源配置", () => {
    const rules: MonsterSpawnRule[] = [
      {
        slot: 0,
        monsterType: MonsterType.Rhino,
        maxActiveCount: 0,
        trigger: { source: "money", mode: "multiple", interval: 100, catchUp: false },
      },
      {
        slot: 0,
        monsterType: 999 as MonsterType,
        maxActiveCount: 1,
        trigger: { source: "money", mode: "multiple", interval: 0, catchUp: false },
      },
    ];

    expect(validateMonsterConfig(MONSTER_CONFIG, rules)).toEqual([
      "MONSTER_SPAWN_RULES[0].maxActiveCount 必须大于 0",
      "MONSTER_SPAWN_RULES slot 重复: 0",
      "MONSTER_CONFIG 缺少 monsterType=999 的资源配置",
      "MONSTER_SPAWN_RULES[1].trigger.interval 必须大于 0",
    ]);
  });
});
