import { HammerEntity } from "../ecs/gameplay/hammer/HammerEntity";
import { hammerSystem as runHammerSystem } from "../ecs/gameplay/hammer/HammerSystem";
import { HammerProjection } from "../sync/projections/HammerProjection";
import { HammerNode } from "../view/HammerNode";
import { defineGameFeature } from "../framework/feature/FeatureManifest";

function hammerSystem(world: any, deltaSec: number): void {
  runHammerSystem(world, undefined, false, false, deltaSec);
}

export const HammerFeature = defineGameFeature({
  name: "hammer",
  entities: [HammerEntity],
  projections: [HammerProjection],
  systems: {
    state: [hammerSystem],
  },
  setup: ({ entities, views }) => {
    views.mount({
      eid: entities.one(HammerEntity),
      projection: HammerProjection,
      create: () => new HammerNode(),
    });
  },
});
