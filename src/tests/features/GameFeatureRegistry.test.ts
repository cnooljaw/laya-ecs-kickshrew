import { describe, expect, it } from "vitest";
import { MONSTER_SPAWN_RULES } from "../../game/features/monster";
import {
  BoardFeature,
  BoardOccupantKind,
  BoardRuntime,
  BoardCapability,
  HoleComponent,
  HoleEntity,
  HoleProjection,
  SceneComponent,
  SceneEntity,
  SceneProjection,
  setupBoard,
} from "../../game/features/board";
import { ShrewAction, ShrewComponent, ShrewEntity } from "../../game/features/shrew";
import { HammerEntity } from "../../game/features/hammer";
import { PlayerComponent, PlayerEntity } from "../../game/features/playerHud";
import { MonsterEntity, MonsterTriggerEntity } from "../../game/features/monster";
import { PerfHeroEntity } from "../../game/features/perfHero";
import { createEntityRuntime } from "../../framework/ecs/EntityRuntime";
import { defineEntity } from "../../framework/ecs/EntityDefinition";
import { createGameWorld } from "../../framework/ecs/GameWorld";
import { setupCoreGameplay } from "../../game/features/shrew";
import {
  defineFeature,
  defineSystem,
  type FeatureManifest,
} from "../../framework/feature/FeatureManifest";
import { GAME_FEATURES, GAME_FEATURE_REGISTRY } from "../../game/GameFeatures";
import { createGameFeatureRegistry, validateGameFeatures } from "../../framework/feature/FeatureRegistry";
import {
  defineCapability,
  type FeatureCapability,
  type FeatureSetupContext,
} from "../../framework/feature/FeatureSetupContext";
import {
  defineProjection,
  noProjection,
  projectionSource,
  watch,
} from "../../framework/sync/ProjectionDefinition";
import { ShrewProjection } from "../../game/features/shrew";
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
  const capabilities = new Map<FeatureCapability<any>, any>();
  let resources = 0;
  const context: FeatureSetupContext = {
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
    mountSingleton: ({ entity, projection, create }: any) => {
      const eid = entities.one(entity);
      mounts.set(projection.name, (mounts.get(projection.name) ?? 0) + 1);
      return create(eid, 0);
    },
    createAndMountMany: ({ entity, inputs, projection, create }: any) => {
      const eids = entities.createMany(entity, inputs);
      return eids.map((eid: number, index: number) => {
        mounts.set(projection.name, (mounts.get(projection.name) ?? 0) + 1);
        return create(eid, index);
      });
    },
    provide: (capability, value) => {
      capabilities.set(capability, value);
    },
    use: capability => {
      if (!capabilities.has(capability)) {
        throw new Error(`Feature capability is not provided: ${capability.name}`);
      }
      return capabilities.get(capability);
    },
    own: <T extends { destroy(): void }>(resource: T) => {
      resources++;
      return resource;
    },
  };
  return {
    mounts,
    context,
    resourceCount: () => resources,
  };
}

describe("GameFeatureRegistry", () => {
  it("shares typed setup capabilities between features", () => {
    const TestCapability = defineCapability<{ value: number }>("test.capability");
    const world = createGameWorld();
    const entities = createEntityRuntime(world, []);
    const setup = createSetupContext(entities);

    setup.context.provide(TestCapability, { value: 7 });

    expect(setup.context.use(TestCapability).value).toBe(7);
  });

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
    expect(GAME_FEATURES.map(feature => feature.name).slice(0, 3)).toEqual([
      "board",
      "monster",
      "shrew",
    ]);
    expect(GAME_FEATURE_REGISTRY.systemsByPhase("state").map(item => item.name)).toEqual([
      "board.mapCycle",
      "shrew.animationTimer",
      "shrew.state",
      "hammer.state",
      "session.hammerThunder",
    ]);
    expect(GAME_FEATURE_REGISTRY.systemsByPhase("feature").map(item => item.name)).toEqual([
      "monster.lifetime",
      "monster.spawn",
      "shrew.boardSync",
      "perfHero.state",
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

    const boardResult = setupBoard(context);
    const result = setupCoreGameplay(context);

    expect(boardResult.holes).toHaveLength(9);
    expect(result.shrews).toHaveLength(9);
    expect(context.use(BoardCapability)).toBeInstanceOf(BoardRuntime);
    expect(boardResult.holes.map(eid => HoleComponent.residentEid[eid])).toEqual(result.shrews);
    expect(boardResult.holes.map(eid => HoleComponent.occupantEid[eid])).toEqual(result.shrews);
  });

  it("mounts singleton entity views through setup context capability", () => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, [TestSceneEntity]);
    entities.bootstrapSingletons();
    const setup = createSetupContext(entities);

    const node = setup.context.mountSingleton({
      entity: TestSceneEntity,
      projection: TestSceneProjection,
      create: () => ({ destroy: () => {}, create: () => {} }),
    });

    expect(node).toBeDefined();
    expect(Object.fromEntries(setup.mounts)).toEqual({ testScene: 1 });
  });

  it("creates and mounts many entity views through setup context capability", () => {
    const ManyEntity = defineEntity<number>({
      name: "testMany",
      components: [SceneComponent],
      cardinality: "many",
      initialize: (eid, value) => {
        SceneComponent.currentMap[eid] = value;
      },
    });
    const ManyProjection = defineProjection({
      name: "testMany",
      components: [SceneComponent],
      rows: [watch(sceneSource, ["currentMap"], "current map", noProjection)],
    });
    const world = createGameWorld();
    const entities = createEntityRuntime(world, [ManyEntity]);
    const setup = createSetupContext(entities);

    const nodes = setup.context.createAndMountMany({
      entity: ManyEntity,
      inputs: [1, 2, 3],
      projection: ManyProjection,
      create: () => ({ destroy: () => {}, create: () => {} }),
    });

    expect(nodes).toHaveLength(3);
    expect(Object.fromEntries(setup.mounts)).toEqual({ testMany: 3 });
  });

  it("sets up the complete runtime through stable capabilities", () => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, GAME_FEATURE_REGISTRY.entityTypes());
    entities.bootstrapSingletons();
    const setup = createSetupContext(entities);

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

  it("runs Monster occupancy before final Shrew board sync in the same loop frame", () => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, GAME_FEATURE_REGISTRY.entityTypes());
    entities.bootstrapSingletons();
    const setup = createSetupContext(entities);
    GAME_FEATURE_REGISTRY.setupAll(setup.context);
    const board = setup.context.use(BoardCapability);

    PlayerComponent.money[entities.one(PlayerEntity)] = 100;
    for (const hole of board.holes) {
      const shrew = HoleComponent.residentEid[hole];
      ShrewComponent.actionState[shrew] = ShrewAction.Stand;
      ShrewComponent.isClickable[shrew] = 1;
    }

    for (const system of GAME_FEATURE_REGISTRY.systemsByPhase("state")) {
      system.run(world, 0);
    }
    for (const system of GAME_FEATURE_REGISTRY.systemsByPhase("feature")) {
      system.run(world, 0);
    }

    const monsterHoles = board.holes.filter(hole => HoleComponent.occupantKind[hole] === BoardOccupantKind.Monster);
    expect(monsterHoles).toHaveLength(3);
    for (const hole of monsterHoles) {
      const shrew = HoleComponent.residentEid[hole];
      expect(ShrewComponent.actionState[shrew]).toBe(ShrewAction.Wait);
      expect(ShrewComponent.isClickable[shrew]).toBe(0);
    }
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
    expect(GAME_FEATURES).toContain(BoardFeature);
    expect(() => validateGameFeatures(GAME_FEATURES)).not.toThrow();
  });
});
