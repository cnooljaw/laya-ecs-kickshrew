import { createRuleSyncChannel } from "../../binding/SyncView";
import { DirtyComponent } from "../../ecs/components";
import type { GameFeature } from "../GameFeature";
import { createMonsterEntities, createMonsterSpawnState } from "./MonsterFactory";
import { MonsterDirtyAspect } from "./MonsterDirtyAspect";
import { MonsterNode } from "./MonsterNode";
import { monsterLifetimeSystem, monsterSpawnSystem } from "./MonsterSystem";
import { MONSTER_SPAWN_RULES } from "./MonsterConfig";
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
    createMonsterSpawnState(world);
    const count = Math.max(...MONSTER_SPAWN_RULES.map(rule => rule.maxActiveCount), 0);
    const entities = createMonsterEntities(world, { count });
    for (const eid of entities) {
      const node = new MonsterNode();
      node.create(root);
      viewRegistry.registerNode(eid, node, monsterRegistry);
      DirtyComponent.forceFullSync[eid] = 1;
      forceFullSyncEntities.push(eid);
    }
  },
};
