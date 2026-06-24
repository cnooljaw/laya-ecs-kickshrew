import { HammerViewSync } from "../binding/viewSyncs";
import { hammerSystem } from "../ecs/gameplay/hammer/HammerSystem";
import { HammerNode } from "../view/HammerNode";
import { system, type GameFeature } from "./GameFeature";

export const HammerFeature: GameFeature = {
  name: "hammer",
  systems: [
    system("state", "hammerSystem", (world, deltaSec) => {
      hammerSystem(world, undefined, false, false, deltaSec);
    }),
  ],
  viewSyncs: [
    HammerViewSync,
  ],
  setup: ({ root, singletons, mount }) => {
    const hammerNode = new HammerNode();
    hammerNode.create(root);
    mount(HammerViewSync, singletons.hammer, hammerNode);
  },
};
