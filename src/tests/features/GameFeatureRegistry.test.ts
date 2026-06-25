import { describe, expect, it } from "vitest";
import { MONSTER_SPAWN_RULES } from "../../config/MonsterConfig";
import { HoleComponent, SceneComponent } from "../../ecs/components";
import { HoleEntity, SceneEntity, ShrewEntity } from "../../ecs/gameplay/core/CoreEntities";
import { HammerEntity } from "../../ecs/gameplay/hammer/HammerEntity";
import { PlayerEntity } from "../../ecs/gameplay/hud/PlayerEntity";
import { MonsterEntity, MonsterTriggerEntity } from "../../ecs/gameplay/monster/MonsterEntity";
import { PerfHeroEntity } from "../../ecs/gameplay/perfHero/PerfHeroEntity";
import { createEntityRuntime } from "../../framework/ecs/EntityRuntime";
import { defineEntity } from "../../framework/ecs/EntityDefinition";
import { createGameWorld } from "../../ecs/world";
import { setupCoreGameplay } from "../../features/CoreGameplayFeature";
import { defineGameFeature, type GameFeature } from "../../framework/feature/FeatureManifest";
import { GAME_FEATURES, GAME_FEATURE_REGISTRY } from "../../features/GameFeatures";
import { createGameFeatureRegistry, validateGameFeatures } from "../../framework/feature/FeatureRegistry";
import {
  defineProjection,
  noProjection,
  projectionSource,
  watch,
} from "../../framework/sync/ProjectionDefinition";
import { HoleProjection, SceneProjection, ShrewProjection } from "../../sync/projections/CoreProjections";
import { HammerProjection } from "../../sync/projections/HammerProjection";
import { PlayerProjection } from "../../sync/projections/HudProjection";
import { MonsterProjection } from "../../sync/projections/MonsterProjection";
import { PerfHeroProjection } from "../../sync/projections/PerfHeroProjection";

const TestSceneEntity = defineEntity({
  name: "testScene",
  components: [SceneComponent],
  cardinality: "one",
  initialize: () => {},
});
const sceneSource = projectionSource("scene", SceneComponent);
const TestSceneProjection = defineProjection({
  name: "testScene",
  components: [SceneComponent],
  rows: [watch(sceneSource, ["currentMap"], "current map", noProjection)],
});

function feature(name: string): GameFeature {
  const run = Object.defineProperty(() => {}, "name", { value: `${name}System` });
  return defineGameFeature({
    name,
    systems: { feature: [run] },
  });
}

function createSetupContext(entities: ReturnType<typeof createEntityRuntime>) {
  const mounts = new Map<string, number>();
  let resources = 0;
  return {
    mounts,
    context: {
      world: {},
      entities,
      effects: {
        on: () => {},
        emit: () => {},
      },
      views: {
        create: ({ create }: any) => {
          resources++;
          return create();
        },
        mount: ({ projection, create }: any) => {
          mounts.set(projection.name, (mounts.get(projection.name) ?? 0) + 1);
          return create();
        },
        mountMany: ({ eids, projection, create }: any) => eids.map((eid: number, index: number) => {
          mounts.set(projection.name, (mounts.get(projection.name) ?? 0) + 1);
          return create(eid, index);
        }),
      },
      resources: {
        own: <T>(resource: T) => {
          resources++;
          return resource;
        },
      },
    } as any,
    resourceCount: () => resources,
  };
}

describe("GameFeatureRegistry", () => {
  it("expands entities, projections and phased systems", () => {
    function updateState(): void {}
    function updateFeature(): void {}
    const registry = createGameFeatureRegistry([
      defineGameFeature({
        name: "compiled",
        entities: [TestSceneEntity],
        projections: [TestSceneProjection],
        systems: { state: [updateState], feature: [updateFeature] },
      }),
    ]);

    expect(registry.entityTypes()).toEqual([TestSceneEntity]);
    expect(registry.projections()).toEqual([TestSceneProjection]);
    expect(registry.systemsByPhase("state").map(item => item.run)).toEqual([updateState]);
    expect(registry.systemsByPhase("feature").map(item => item.run)).toEqual([updateFeature]);
  });

  it("keeps real feature contribution order stable", () => {
    expect(GAME_FEATURE_REGISTRY.systemsByPhase("state").map(item => item.name)).toEqual([
      "animationTimerSystem",
      "shrewStateSystem",
      "sceneCycleSystem",
      "hammerSystem",
    ]);
    expect(GAME_FEATURE_REGISTRY.entityTypes()).toEqual(expect.arrayContaining([
      SceneEntity,
      HoleEntity,
      ShrewEntity,
      HammerEntity,
      PlayerEntity,
      PerfHeroEntity,
      MonsterEntity,
      MonsterTriggerEntity,
    ]));
    expect(GAME_FEATURE_REGISTRY.projections()).toEqual(expect.arrayContaining([
      SceneProjection,
      HoleProjection,
      ShrewProjection,
      HammerProjection,
      PlayerProjection,
      PerfHeroProjection,
      MonsterProjection,
    ]));
  });

  it("explicitly assembles nine hole-shrew pairs", () => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, [SceneEntity, HoleEntity, ShrewEntity]);
    entities.bootstrapSingletons();
    const { context } = createSetupContext(entities);

    const result = setupCoreGameplay(context);

    expect(result.holes).toHaveLength(9);
    expect(result.shrews).toHaveLength(9);
    expect(result.holes.map(eid => HoleComponent.shrewEid[eid])).toEqual(result.shrews);
  });

  it("sets up the complete runtime through stable capabilities", () => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, GAME_FEATURE_REGISTRY.entityTypes());
    entities.bootstrapSingletons();
    const setup = createSetupContext(entities);
    setup.context.world = world;

    GAME_FEATURE_REGISTRY.setupAll(setup.context);

    expect(Object.fromEntries(setup.mounts)).toEqual({
      scene: 1,
      hole: 9,
      shrew: 9,
      hammer: 1,
      player: 1,
      monster: MONSTER_SPAWN_RULES.reduce((count, rule) => count + rule.maxActiveCount, 0),
    });
    expect(setup.resourceCount()).toBe(1);
  });

  it("reuses precomputed phase arrays", () => {
    const registry = createGameFeatureRegistry([feature("featureA")]);
    expect(registry.systemsByPhase("feature")).toBe(registry.systemsByPhase("feature"));
    expect(registry.systemsByPhase("state")).toBe(registry.systemsByPhase("state"));
  });

  it("rejects duplicate names", () => {
    const duplicateSystem = () => {};
    expect(() => validateGameFeatures([
      defineGameFeature({ name: "a", systems: { state: [duplicateSystem] } }),
      defineGameFeature({ name: "b", systems: { feature: [duplicateSystem] } }),
    ])).toThrow("FeatureSystem name 重复: duplicateSystem");
    expect(() => validateGameFeatures([feature("same"), feature("same")]))
      .toThrow("GameFeature name 重复: same");
    expect(() => validateGameFeatures([
      defineGameFeature({ name: "a", entities: [TestSceneEntity] }),
      defineGameFeature({ name: "b", entities: [TestSceneEntity] }),
    ])).toThrow("EntityDefinition name 重复: testScene");
    expect(() => validateGameFeatures([
      defineGameFeature({ name: "a", projections: [TestSceneProjection] }),
      defineGameFeature({ name: "b", projections: [TestSceneProjection] }),
    ])).toThrow("Projection name 重复: testScene");
  });

  it("validates the real feature table", () => {
    expect(() => validateGameFeatures(GAME_FEATURES)).not.toThrow();
  });
});
