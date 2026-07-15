import { defineFeature, defineSystem } from "../../../framework/feature/FeatureManifest";
import { HammerEntity } from "./HammerEntities";
import { HammerNode } from "./HammerNode";
import { HammerProjection } from "./HammerProjection";
import { advanceHammerCooldownSystem } from "./HammerSystems";

export const HammerFeature = defineFeature({
  name: "hammer",
  entities: [HammerEntity],
  projections: [HammerProjection],
  systems: [defineSystem("state", "hammer.cooldown", advanceHammerCooldownSystem)],
  setup: ({ mountSingleton }) => {
    mountSingleton({
      entity: HammerEntity,
      projection: HammerProjection,
      create: () => new HammerNode(),
    });
  },
});
