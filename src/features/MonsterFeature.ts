import { assertValidMonsterConfig, MONSTER_SPAWN_RULES } from "../config/MonsterConfig";
import { MonsterEntity, MonsterTriggerEntity } from "../ecs/gameplay/monster/MonsterEntity";
import {
  createMonsterPool,
  createMonsterTriggerEntities,
} from "../ecs/gameplay/monster/MonsterFactory";
import { monsterLifetimeSystem, monsterSpawnSystem } from "../ecs/gameplay/monster/MonsterSystem";
import { MonsterProjection } from "../sync/projections/MonsterProjection";
import { MonsterNode } from "../view/MonsterNode";
import { defineFeature, defineSystem } from "../framework/feature/FeatureManifest";

export const MonsterFeature = defineFeature({
  name: "monster",
  entities: [MonsterEntity, MonsterTriggerEntity],
  projections: [MonsterProjection],
  systems: [
    defineSystem("feature", "monster.lifetime", monsterLifetimeSystem),
    defineSystem("feature", "monster.spawn", monsterSpawnSystem),
  ],
  setup: ({ entities, mountPool }) => {
    assertValidMonsterConfig();
    createMonsterTriggerEntities(entities, MONSTER_SPAWN_RULES);
    const eids = createMonsterPool(entities, MONSTER_SPAWN_RULES);
    mountPool({
      eids,
      projection: MonsterProjection,
      create: () => new MonsterNode(),
    });
  },
});
