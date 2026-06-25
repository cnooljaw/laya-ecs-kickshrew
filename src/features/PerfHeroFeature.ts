import { getPerfTestRuntimeConfig } from "../config/PerfTestConfig";
import { PerfHeroEntity } from "../ecs/gameplay/perfHero/PerfHeroEntity";
import { perfHeroSystem } from "../ecs/gameplay/perfHero/PerfHeroSystem";
import { PerfHeroProjection } from "../sync/projections/PerfHeroProjection";
import { PerfHeroNode, PerfHeroSpinePoolGroup } from "../view/PerfHeroNode";
import { defineFeature, defineSystem } from "../framework/feature/FeatureManifest";

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
