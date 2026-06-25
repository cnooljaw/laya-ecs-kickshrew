import { describe, expect, it } from "vitest";
import {
  MONSTER_SPAWN_RULES,
  validateMonsterRules,
  type MonsterSpawnRule,
} from "../../../../game/features/monster/MonsterRules";
import { MonsterType } from "../../../../game/features/monster/MonsterTypes";
import {
  MONSTER_VIEW_CONFIG,
  validateMonsterViewConfig,
} from "../../../../game/features/monster/MonsterViewConfig";

describe("Monster configuration", () => {
  it("validates the default rule and view configuration", () => {
    expect(validateMonsterRules(MONSTER_SPAWN_RULES)).toEqual([]);
    expect(validateMonsterViewConfig(MONSTER_VIEW_CONFIG)).toEqual([]);
  });

  it("reports duplicate slots, invalid counts and invalid trigger intervals", () => {
    const rules: MonsterSpawnRule[] = [
      {
        slot: 0,
        monsterType: MonsterType.Rhino,
        maxActiveCount: 0,
        trigger: { source: "money", mode: "multiple", interval: 100, catchUp: false },
      },
      {
        slot: 0,
        monsterType: MonsterType.Rhino,
        maxActiveCount: 1,
        trigger: { source: "money", mode: "multiple", interval: 0, catchUp: false },
      },
    ];

    expect(validateMonsterRules(rules)).toEqual([
      "MONSTER_SPAWN_RULES[0].maxActiveCount 必须大于 0",
      "MONSTER_SPAWN_RULES slot 重复: 0",
      "MONSTER_SPAWN_RULES[1].trigger.interval 必须大于 0",
    ]);
  });

  it("reports missing and invalid view resources independently", () => {
    expect(validateMonsterViewConfig({})).toEqual([
      "MONSTER_VIEW_CONFIG 缺少 monsterType=1",
    ]);
    expect(validateMonsterViewConfig({
      [MonsterType.Rhino]: {
        skUrl: "",
        pngUrl: "",
        scale: 0,
        posX: 0,
        posY: 0,
      },
    })).toEqual([
      "MONSTER_VIEW_CONFIG[1].skUrl 不能为空",
      "MONSTER_VIEW_CONFIG[1].pngUrl 不能为空",
      "MONSTER_VIEW_CONFIG[1].scale 必须大于 0",
    ]);
  });
});
