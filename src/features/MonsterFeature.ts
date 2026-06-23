import { monsterRegistry, monsterViewBinding } from "../binding/MonsterViewBinding";
import { createRuleSyncChannel } from "../binding/SyncView";
import { assertValidMonsterConfig, MONSTER_SPAWN_RULES } from "../config/MonsterConfig";
import { DirtyComponent } from "../ecs/components";
import { createMonsterEntitiesForRules, createMonsterSpawnState } from "../ecs/gameplay/monster/MonsterFactory";
import { monsterLifetimeSystem, monsterSpawnSystem } from "../ecs/gameplay/monster/MonsterSystem";
import { MonsterDirtyAspect } from "../sync/dirty/aspects/MonsterDirtyAspect";
import { MONSTER_SYNC_RULES } from "../sync/rules/MonsterSyncRules";
import { MonsterNode } from "../view/MonsterNode";
import { system, type GameFeature } from "./GameFeature";

export const MonsterFeature: GameFeature = {
  name: "monster",
  systems: [
    system("feature", "monsterLifetimeSystem", monsterLifetimeSystem),
    system("feature", "monsterSpawnSystem", monsterSpawnSystem),
  ],
  dirtyAspects: [MonsterDirtyAspect],
  syncChannels: [
    createRuleSyncChannel({
      name: "monster",
      dirtyTarget: "monsterDirty",
      rules: MONSTER_SYNC_RULES,
      binding: monsterViewBinding,
    }),
  ],
  setup: ({ world, root, viewRegistry, forceFullSyncEntities }) => {
    assertValidMonsterConfig();
    createMonsterSpawnState(world);
    const entities = createMonsterEntitiesForRules(world, MONSTER_SPAWN_RULES);
    for (const eid of entities) {
      const node = new MonsterNode();
      node.create(root);
      viewRegistry.registerNode(eid, node, monsterRegistry);
      DirtyComponent.forceFullSync[eid] = 1;
      forceFullSyncEntities.push(eid);
    }
  },
};
