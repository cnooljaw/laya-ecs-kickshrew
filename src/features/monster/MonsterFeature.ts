import { createRuleSyncChannel } from "../../binding/SyncView";
import { DirtyComponent } from "../../ecs/components";
import { system, type GameFeature } from "../GameFeature";
import { monsterRegistry, monsterViewBinding } from "../../binding/MonsterViewBinding";
import { assertValidMonsterConfig, MONSTER_SPAWN_RULES } from "../../config/MonsterConfig";
import { MonsterDirtyAspect } from "../../ecs/gameplay/monster/MonsterDirtyAspect";
import { createMonsterEntitiesForRules, createMonsterSpawnState } from "../../ecs/gameplay/monster/MonsterFactory";
import { monsterLifetimeSystem, monsterSpawnSystem } from "../../ecs/gameplay/monster/MonsterSystem";
import { MONSTER_SYNC_RULES } from "../../sync/rules/MonsterSyncRules";
import { MonsterNode } from "../../view/MonsterNode";

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
