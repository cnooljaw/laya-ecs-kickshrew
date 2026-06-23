import { coreSyncChannels } from "../binding/CoreSyncChannels";
import { perfHeroSystem } from "../ecs/gameplay/perfHero/PerfHeroSystem";
import { createPerfHeroEntities } from "../ecs/world";
import { PerfHeroDirtyAspect } from "../sync/dirty/aspects/PerfHeroDirtyAspect";
import { PerfHeroNode, PerfHeroSpinePoolGroup } from "../view/PerfHeroNode";
import { system, type GameFeature } from "./GameFeature";

export const PerfHeroFeature: GameFeature = {
  name: "perfHero",
  systems: [
    system("feature", "perfHeroSystem", perfHeroSystem),
  ],
  dirtyAspects: [
    PerfHeroDirtyAspect,
  ],
  syncChannels: coreSyncChannels(["perfHero"]),
  setup: ({ world, root, viewRegistry, perfConfig, runtimeRefs, forceFullSyncEntities }) => {
    if (perfConfig.heroCount <= 0) return;

    const entities = createPerfHeroEntities(world, perfConfig.heroCount);
    const pool = new PerfHeroSpinePoolGroup();
    runtimeRefs.perfHeroPool = pool;

    for (const eid of entities) {
      const node = new PerfHeroNode(pool);
      node.create(root);
      viewRegistry.registerPerfHeroNode(eid, node);
      forceFullSyncEntities.push(eid);
    }
  },
};
