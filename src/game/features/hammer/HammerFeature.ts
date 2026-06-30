import { defineFeature, defineSystem } from "../../../framework/feature/FeatureManifest";
import { HammerEntity } from "./HammerEntities";
import { HammerNode } from "./HammerNode";
import { HammerProjection } from "./HammerProjection";
import { hammerSystem as runHammerSystem } from "./HammerSystems";

function hammerSystem(world: any, deltaSec: number): void {
  runHammerSystem(world, undefined, false, false, deltaSec);
}

export const HammerFeature = defineFeature({
  name: "hammer",
  entities: [HammerEntity],
  projections: [HammerProjection],
  systems: [defineSystem("state", "hammer.state", hammerSystem)],
  setup: ({ mountSingleton }) => {
    mountSingleton({
      entity: HammerEntity,
      projection: HammerProjection,
      create: () => new HammerNode(),
    });
  },
});
