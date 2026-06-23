import { coreSyncChannels } from "../binding/CoreSyncChannels";
import { hammerSystem } from "../ecs/gameplay/hammer/HammerSystem";
import { HammerDirtyAspect } from "../sync/dirty/aspects/HammerDirtyAspect";
import { HammerNode } from "../view/HammerNode";
import { system, type GameFeature } from "./GameFeature";

export const HammerFeature: GameFeature = {
  name: "hammer",
  systems: [
    system("state", "hammerSystem", (world, deltaSec) => {
      hammerSystem(world, undefined, false, false, deltaSec);
    }),
  ],
  dirtyAspects: [
    HammerDirtyAspect,
  ],
  syncChannels: coreSyncChannels(["hammer"]),
  setup: ({ root, singletons, viewRegistry, runtimeRefs, forceFullSyncEntities }) => {
    const hammerNode = new HammerNode();
    hammerNode.create(root);
    viewRegistry.registerHammerNode(singletons.hammer, hammerNode);
    runtimeRefs.hammerNode = hammerNode;
    forceFullSyncEntities.push(singletons.hammer);
  },
};
