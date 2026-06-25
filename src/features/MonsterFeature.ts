import { assertValidMonsterConfig, MONSTER_SPAWN_RULES } from "../config/MonsterConfig";
import { MonsterEntity, MonsterTriggerEntity } from "../ecs/gameplay/monster/MonsterEntity";
import {
  createMonsterPool,
  createMonsterTriggerEntities,
} from "../ecs/gameplay/monster/MonsterFactory";
import { monsterLifetimeSystem, monsterSpawnSystem } from "../ecs/gameplay/monster/MonsterSystem";
import { MonsterProjection } from "../sync/projections/MonsterProjection";
import { MonsterNode } from "../view/MonsterNode";
import { defineGameFeature } from "./GameFeature";

export const MonsterFeature = defineGameFeature({
  name: "monster",
  entities: [MonsterEntity, MonsterTriggerEntity],
  projections: [MonsterProjection],
  systems: {
    feature: [monsterLifetimeSystem, monsterSpawnSystem],
  },
  setup: ({ entities, views }) => {
    assertValidMonsterConfig();
    createMonsterTriggerEntities(entities, MONSTER_SPAWN_RULES);
    const eids = createMonsterPool(entities, MONSTER_SPAWN_RULES);
    views.mountMany({
      eids,
      projection: MonsterProjection,
      create: () => new MonsterNode(),
    });
  },
});
