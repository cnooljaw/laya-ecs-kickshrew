import { getPerfTestRuntimeConfig } from "../config/PerfTestConfig";
import { PerfHeroEntity } from "../ecs/gameplay/perfHero/PerfHeroEntity";
import { perfHeroSystem } from "../ecs/gameplay/perfHero/PerfHeroSystem";
import { PerfHeroProjection } from "../sync/projections/PerfHeroProjection";
import { PerfHeroNode, PerfHeroSpinePoolGroup } from "../view/PerfHeroNode";
import { defineGameFeature } from "../framework/feature/FeatureManifest";

export const PerfHeroFeature = defineGameFeature({
  name: "perfHero",
  entities: [PerfHeroEntity],
  projections: [PerfHeroProjection],
  systems: {
    feature: [perfHeroSystem],
  },
  setup: ({ entities, views, resources }) => {
    const config = getPerfTestRuntimeConfig();
    if (config.heroCount <= 0) return;

    const eids = entities.createMany(
      PerfHeroEntity,
      Array.from({ length: config.heroCount }, (_, index) => index),
    );
    const pool = resources.own(new PerfHeroSpinePoolGroup());
    views.mountMany({
      eids,
      projection: PerfHeroProjection,
      create: () => new PerfHeroNode(pool),
    });
  },
});
