import { describe, expect, it } from "vitest";
import { MONSTER_SPAWN_RULES } from "../../game/features/monster";
import { HoleComponent, SceneComponent } from "../../game/features/shrew";
import { HoleEntity, SceneEntity, ShrewEntity } from "../../game/features/shrew";
import { HammerEntity } from "../../game/features/hammer";
import { PlayerEntity } from "../../game/features/playerHud";
import { MonsterEntity, MonsterTriggerEntity } from "../../game/features/monster";
import { PerfHeroEntity } from "../../game/features/perfHero";
import { createEntityRuntime } from "../../framework/ecs/EntityRuntime";
import { defineEntity } from "../../framework/ecs/EntityDefinition";
import { createGameWorld } from "../../ecs/world";
import { setupCoreGameplay } from "../../game/features/shrew";
import {
  defineFeature,
  defineSystem,
  type FeatureManifest,
} from "../../framework/feature/FeatureManifest";
import { GAME_FEATURES, GAME_FEATURE_REGISTRY } from "../../features/GameFeatures";
import { createGameFeatureRegistry, validateGameFeatures } from "../../framework/feature/FeatureRegistry";
import {
  defineProjection,
  noProjection,
  projectionSource,
  watch,
} from "../../framework/sync/ProjectionDefinition";
import { HoleProjection, SceneProjection, ShrewProjection } from "../../game/features/shrew";
import { HammerProjection } from "../../game/features/hammer";
import { PlayerProjection } from "../../game/features/playerHud";
import { MonsterProjection } from "../../game/features/monster";
import { PerfHeroProjection } from "../../game/features/perfHero";

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

function feature(name: string): FeatureManifest {
  const run = () => {};
  return defineFeature({
    name,
    systems: [defineSystem("feature", `${name}.system`, run)],
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
      createView: ({ create }: any) => {
        resources++;
        return create();
      },
      mountOne: ({ projection, create }: any) => {
        mounts.set(projection.name, (mounts.get(projection.name) ?? 0) + 1);
        return create();
      },
      mountPool: ({ eids, projection, create }: any) => eids.map((eid: number, index: number) => {
        mounts.set(projection.name, (mounts.get(projection.name) ?? 0) + 1);
        return create(eid, index);
      }),
      own: <T>(resource: T) => {
        resources++;
        return resource;
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
      defineFeature({
        name: "compiled",
        entities: [TestSceneEntity],
        projections: [TestSceneProjection],
        systems: [
          defineSystem("state", "compiled.state", updateState),
          defineSystem("feature", "compiled.feature", updateFeature),
        ],
      }),
    ]);

    expect(registry.entityTypes()).toEqual([TestSceneEntity]);
    expect(registry.projections()).toEqual([TestSceneProjection]);
    expect(registry.systemsByPhase("state").map(item => item.run)).toEqual([updateState]);
    expect(registry.systemsByPhase("feature").map(item => item.run)).toEqual([updateFeature]);
  });

  it("keeps real feature contribution order stable", () => {
    expect(GAME_FEATURE_REGISTRY.systemsByPhase("state").map(item => item.name)).toEqual([
      "shrew.animationTimer",
      "shrew.state",
      "shrew.sceneCycle",
      "hammer.state",
      "session.thunder",
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
      defineFeature({
        name: "a",
        systems: [defineSystem("state", "duplicate.system", duplicateSystem)],
      }),
      defineFeature({
        name: "b",
        systems: [defineSystem("feature", "duplicate.system", duplicateSystem)],
      }),
    ])).toThrow("FeatureSystem name 重复: duplicate.system");
    expect(() => validateGameFeatures([feature("same"), feature("same")]))
      .toThrow("GameFeature name 重复: same");
    expect(() => validateGameFeatures([
      defineFeature({ name: "a", entities: [TestSceneEntity] }),
      defineFeature({ name: "b", entities: [TestSceneEntity] }),
    ])).toThrow("EntityDefinition name 重复: testScene");
    expect(() => validateGameFeatures([
      defineFeature({ name: "a", projections: [TestSceneProjection] }),
      defineFeature({ name: "b", projections: [TestSceneProjection] }),
    ])).toThrow("Projection name 重复: testScene");
  });

  it("validates the real feature table", () => {
    expect(() => validateGameFeatures(GAME_FEATURES)).not.toThrow();
  });
});
