import { MonsterViewSync } from "../binding/viewSyncs";
import { assertValidMonsterConfig, MONSTER_SPAWN_RULES } from "../config/MonsterConfig";
import { createMonsterEntitiesForRules, createMonsterSpawnState } from "../ecs/gameplay/monster/MonsterFactory";
import { monsterLifetimeSystem, monsterSpawnSystem } from "../ecs/gameplay/monster/MonsterSystem";
import { MonsterNode } from "../view/MonsterNode";
import { system, type GameFeature } from "./GameFeature";

export const MonsterFeature: GameFeature = {
  name: "monster",
  systems: [
    system("feature", "monsterLifetimeSystem", monsterLifetimeSystem),
    system("feature", "monsterSpawnSystem", monsterSpawnSystem),
  ],
  viewSyncs: [MonsterViewSync],
  setup: ({ world, root, mount }) => {
    assertValidMonsterConfig();
    createMonsterSpawnState(world);
    const entities = createMonsterEntitiesForRules(world, MONSTER_SPAWN_RULES);
    for (const eid of entities) {
      const node = new MonsterNode();
      node.create(root);
      mount(MonsterViewSync, eid, node);
    }
  },
};
