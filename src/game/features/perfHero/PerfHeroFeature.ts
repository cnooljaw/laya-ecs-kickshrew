import { defineFeature, defineSystem } from "../../../framework/feature/FeatureManifest";
import { PerfHeroEntity } from "./PerfHeroEntities";
import { PerfHeroNode, PerfHeroSpinePoolGroup } from "./PerfHeroNode";
import { PerfHeroProjection } from "./PerfHeroProjection";
import { perfHeroSystem } from "./PerfHeroSystems";
import { getPerfRuntimeConfig } from "./PerfRuntimeConfig";

export const PerfHeroFeature = defineFeature({
  name: "perfHero",
  entities: [PerfHeroEntity],
  projections: [PerfHeroProjection],
  systems: [defineSystem("state", "perfHero.state", perfHeroSystem)],
  setup: ({ createAndMountMany, own }) => {
    const config = getPerfRuntimeConfig();
    if (config.heroCount <= 0) return;

    const pool = own(new PerfHeroSpinePoolGroup());
    createAndMountMany({
      entity: PerfHeroEntity,
      inputs: Array.from({ length: config.heroCount }, (_, index) => index),
      projection: PerfHeroProjection,
      create: () => new PerfHeroNode(pool),
    });
  },
});
