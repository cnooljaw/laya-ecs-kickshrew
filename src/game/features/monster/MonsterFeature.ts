import { defineFeature, defineSystem } from "../../../framework/feature/FeatureManifest";
import { MonsterEntity, MonsterTriggerEntity } from "./MonsterEntities";
import { MonsterNode } from "./MonsterNode";
import {
  createMonsterPool,
  createMonsterPoolInputs,
  createMonsterTriggerEntities,
} from "./MonsterPool";
import { MonsterProjection } from "./MonsterProjection";
import {
  MONSTER_DURATION_SEC,
  MONSTER_SPAWN_RULES,
  validateMonsterRules,
} from "./MonsterRules";
import { monsterBoardSyncSystem, monsterLifetimeSystem, monsterSpawnSystem } from "./MonsterSystems";
import { MONSTER_VIEW_CONFIG, validateMonsterViewConfig } from "./MonsterViewConfig";

export const MonsterFeature = defineFeature({
  name: "monster",
  entities: [MonsterEntity, MonsterTriggerEntity],
  projections: [MonsterProjection],
  systems: [
    defineSystem("feature", "monster.lifetime", monsterLifetimeSystem),
    defineSystem("feature", "monster.boardSync", monsterBoardSyncSystem),
    defineSystem("feature", "monster.spawn", monsterSpawnSystem),
  ],
  setup: ({ entities, mountPool }) => {
    assertValidMonsterFeature();
    createMonsterTriggerEntities(entities, MONSTER_SPAWN_RULES);
    const eids = createMonsterPool(
      entities,
      createMonsterPoolInputs(MONSTER_SPAWN_RULES, MONSTER_VIEW_CONFIG, MONSTER_DURATION_SEC),
    );
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
