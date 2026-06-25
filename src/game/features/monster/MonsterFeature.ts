import { defineFeature, defineSystem } from "../../../framework/feature/FeatureManifest";
import { MonsterEntity, MonsterTriggerEntity, type MonsterEntityInput } from "./MonsterEntities";
import { MonsterNode } from "./MonsterNode";
import { createMonsterPool, createMonsterTriggerEntities } from "./MonsterPool";
import { MonsterProjection } from "./MonsterProjection";
import {
  MONSTER_DURATION_SEC,
  MONSTER_SPAWN_RULES,
  validateMonsterRules,
} from "./MonsterRules";
import { monsterLifetimeSystem, monsterSpawnSystem } from "./MonsterSystems";
import { MONSTER_VIEW_CONFIG, validateMonsterViewConfig } from "./MonsterViewConfig";

export const MonsterFeature = defineFeature({
  name: "monster",
  entities: [MonsterEntity, MonsterTriggerEntity],
  projections: [MonsterProjection],
  systems: [
    defineSystem("feature", "monster.lifetime", monsterLifetimeSystem),
    defineSystem("feature", "monster.spawn", monsterSpawnSystem),
  ],
  setup: ({ entities, mountPool }) => {
    assertValidMonsterFeature();
    createMonsterTriggerEntities(entities, MONSTER_SPAWN_RULES);
    const inputs: MonsterEntityInput[] = [];
    for (const rule of MONSTER_SPAWN_RULES) {
      const view = MONSTER_VIEW_CONFIG[rule.monsterType];
      for (let index = 0; index < rule.maxActiveCount; index++) {
        inputs.push({
          monsterType: rule.monsterType,
          posX: view.posX,
          posY: view.posY,
          scale: view.scale,
          durationSec: MONSTER_DURATION_SEC[rule.monsterType],
        });
      }
    }
    const eids = createMonsterPool(entities, inputs);
    mountPool({
      eids,
      projection: MonsterProjection,
      create: () => new MonsterNode(),
    });
  },
});

function assertValidMonsterFeature(): void {
  const issues = [
    ...validateMonsterRules(),
    ...validateMonsterViewConfig(),
  ];
  if (issues.length > 0) {
    throw new Error(`Monster 配置无效:\n${issues.join("\n")}`);
  }
}
