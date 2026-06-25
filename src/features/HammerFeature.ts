import { HammerEntity } from "../ecs/gameplay/hammer/HammerEntity";
import { hammerSystem as runHammerSystem } from "../ecs/gameplay/hammer/HammerSystem";
import { HammerProjection } from "../sync/projections/HammerProjection";
import { HammerNode } from "../view/HammerNode";
import { defineFeature, defineSystem } from "../framework/feature/FeatureManifest";

function hammerSystem(world: any, deltaSec: number): void {
  runHammerSystem(world, undefined, false, false, deltaSec);
}

export const HammerFeature = defineFeature({
  name: "hammer",
  entities: [HammerEntity],
  projections: [HammerProjection],
  systems: [defineSystem("state", "hammer.state", hammerSystem)],
  setup: ({ entities, mountOne }) => {
    mountOne({
      eid: entities.one(HammerEntity),
      projection: HammerProjection,
      create: () => new HammerNode(),
    });
  },
});
