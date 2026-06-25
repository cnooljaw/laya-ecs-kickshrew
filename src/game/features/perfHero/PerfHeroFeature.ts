import { defineFeature, defineSystem } from "../../../framework/feature/FeatureManifest";
import { PerfHeroEntity } from "./PerfHeroEntities";
import { PerfHeroNode, PerfHeroSpinePoolGroup } from "./PerfHeroNode";
import { PerfHeroProjection } from "./PerfHeroProjection";
import { perfHeroSystem } from "./PerfHeroSystems";
import { getPerfTestRuntimeConfig } from "./PerfTestConfig";

export const PerfHeroFeature = defineFeature({
  name: "perfHero",
  entities: [PerfHeroEntity],
  projections: [PerfHeroProjection],
  systems: [defineSystem("feature", "perfHero.state", perfHeroSystem)],
  setup: ({ entities, mountPool, own }) => {
    const config = getPerfTestRuntimeConfig();
    if (config.heroCount <= 0) return;

    const eids = entities.createMany(
      PerfHeroEntity,
      Array.from({ length: config.heroCount }, (_, index) => index),
    );
    const pool = own(new PerfHeroSpinePoolGroup());
    mountPool({
      eids,
      projection: PerfHeroProjection,
      create: () => new PerfHeroNode(pool),
    });
  },
});
