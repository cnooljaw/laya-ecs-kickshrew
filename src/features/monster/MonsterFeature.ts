import { createRuleSyncChannel } from "../../binding/SyncView";
import { DirtyComponent } from "../../ecs/components";
import type { GameFeature } from "../GameFeature";
import { createMonsterEntitiesForRules, createMonsterSpawnState } from "./MonsterFactory";
import { MonsterDirtyAspect } from "./MonsterDirtyAspect";
import { MonsterNode } from "./MonsterNode";
import { monsterLifetimeSystem, monsterSpawnSystem } from "./MonsterSystem";
import { assertValidMonsterConfig, MONSTER_SPAWN_RULES } from "./MonsterConfig";
import { MONSTER_VIEW_RULES } from "./MonsterViewRules";
import { monsterRegistry, monsterViewBinding } from "./MonsterViewBinding";

export const MonsterFeature: GameFeature = {
  name: "monster",
  systems: [monsterLifetimeSystem, monsterSpawnSystem],
  dirtyAspects: [MonsterDirtyAspect],
  syncChannels: [
    createRuleSyncChannel({
      name: "monster",
      dirtyTarget: "monsterDirty",
      rules: MONSTER_VIEW_RULES,
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
