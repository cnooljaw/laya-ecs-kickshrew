import { describe, expect, it } from "vitest";
import { getPerfTestRuntimeConfig } from "../../config/PerfTestConfig";
import { MONSTER_SPAWN_RULES } from "../../config/MonsterConfig";
import { DirtyComponent, HoleComponent, SceneComponent } from "../../ecs/components";
import { defineEntityType } from "../../ecs/runtime/EntityType";
import { HammerEntity } from "../../ecs/gameplay/hammer/HammerEntity";
import { createEntityRuntime } from "../../ecs/runtime/EntityRuntime";
import { createGameWorld, createSingletonEntities } from "../../ecs/world";
import type { DirtyAspect } from "../../sync/dirty/DirtySchemaTypes";
import {
  defineGameFeature,
  system,
  type FeatureSetupContext,
  type GameFeature,
} from "../../features/GameFeature";
import { GAME_FEATURES, GAME_FEATURE_REGISTRY } from "../../features/GameFeatures";
import { createGameFeatureRegistry, validateGameFeatures } from "../../features/GameFeatureRegistry";
import type { ViewSyncModule } from "../../sync/viewSync/ViewSyncModule";
import {
  defineProjection,
  noProjection,
  projectionSource,
  watch,
} from "../../sync/projection/ProjectionDefinition";
import { HammerProjection } from "../../sync/projections/HammerProjection";
import { MonsterEntity, MonsterTriggerEntity } from "../../ecs/gameplay/monster/MonsterEntity";
import { PerfHeroEntity } from "../../ecs/gameplay/perfHero/PerfHeroEntity";
import { HoleEntity, SceneEntity, ShrewEntity } from "../../ecs/gameplay/core/CoreEntities";
import { MonsterProjection } from "../../sync/projections/MonsterProjection";
import { PerfHeroProjection } from "../../sync/projections/PerfHeroProjection";
import {
  HoleProjection,
  SceneProjection,
  ShrewProjection,
} from "../../sync/projections/CoreProjections";
import { setupCoreGameplay } from "../../features/CoreGameplayFeature";

const sceneAspect: DirtyAspect = {
  name: "sceneAspect",
  description: "test scene dirty aspect",
  requires: [],
  query: () => [],
  channels: [
    {
      name: "scene",
      dirtyTarget: "sceneDirty",
      dirtyArray: DirtyComponent.sceneDirty,
      allBits: 0x01,
      marks: [],
    },
  ],
};

const sceneViewSync: ViewSyncModule = {
  name: "sceneViewSync",
  registryKey: "scene",
  spec: [],
  dirtyAspect: sceneAspect,
  dirtyTarget: "sceneDirty",
  dirtyArray: DirtyComponent.sceneDirty,
  watchedBits: 0x01,
  describe: () => [],
};

const TestSceneEntity = defineEntityType({
  name: "testScene",
  components: [SceneComponent],
  cardinality: "one",
  initialize: () => {},
});
const sceneSource = projectionSource("scene", SceneComponent);
const TestSceneProjection = defineProjection({
  name: "testScene",
  components: [SceneComponent],
  rows: [
    watch(sceneSource, ["currentMap"], "current map", noProjection),
  ],
});

function feature(name: string): GameFeature {
  return {
    name,
    systems: [system("feature", `${name}:system`, () => {})],
    viewSyncs: [
      {
        ...sceneViewSync,
        name: `${name}:sceneViewSync`,
        registryKey: `${name}:scene`,
      },
    ],
  };
}

describe("GameFeatureRegistry", () => {
  it("集中展开 feature systems、dirty aspects 和 view sync descriptions", () => {
    const registry = createGameFeatureRegistry([feature("featureA")]);

    expect(registry.systemsByPhase("feature")).toHaveLength(1);
    expect(registry.systemsByPhase("state")).toEqual([]);
    expect(registry.dirtyAspects()).toEqual([sceneAspect]);
    expect(registry.viewSyncs().map(sync => sync.name)).toEqual(["featureA:sceneViewSync"]);
  });

  it("按 feature 声明顺序稳定展开 systems 和 view syncs", () => {
    const registry = createGameFeatureRegistry([
      feature("first"),
      feature("second"),
    ]);

    expect(registry.systemsByPhase("feature").map(item => item.name)).toEqual([
      "first:system",
      "second:system",
    ]);
    expect(registry.viewSyncs().map(item => item.name)).toEqual([
      "first:sceneViewSync",
      "second:sceneViewSync",
    ]);
  });

  it("展开新 feature manifest 的 entities、projections 和 system groups", () => {
    function updateState(): void {}
    function updateFeature(): void {}
    const manifest = defineGameFeature({
      name: "compiled",
      entities: [TestSceneEntity],
      projections: [TestSceneProjection],
      systems: {
        state: [updateState],
        feature: [updateFeature],
      },
    });

    const registry = createGameFeatureRegistry([manifest]);

    expect(registry.entityTypes()).toEqual([TestSceneEntity]);
    expect(registry.projections()).toEqual([TestSceneProjection]);
    expect(registry.systemsByPhase("state").map(item => item.run)).toEqual([updateState]);
    expect(registry.systemsByPhase("feature").map(item => item.run)).toEqual([updateFeature]);
  });

  it("真实 GAME_FEATURES 表能通过注册校验", () => {
    const registry = createGameFeatureRegistry(GAME_FEATURES);

    expect(registry.systemsByPhase("state").map(system => system.name)).toEqual([
      "animationTimerSystem",
      "shrewStateSystem",
      "sceneCycleSystem",
      "hammerSystem",
    ]);
    expect(registry.viewSyncs().map(sync => sync.name)).not.toContain("monster");
    expect(registry.viewSyncs().map(sync => sync.name)).not.toContain("perfHero");
    expect(registry.entityTypes()).toContain(HammerEntity);
    expect(registry.entityTypes()).toContain(SceneEntity);
    expect(registry.entityTypes()).toContain(HoleEntity);
    expect(registry.entityTypes()).toContain(ShrewEntity);
    expect(registry.entityTypes()).toContain(MonsterEntity);
    expect(registry.entityTypes()).toContain(MonsterTriggerEntity);
    expect(registry.entityTypes()).toContain(PerfHeroEntity);
    expect(registry.projections()).toContain(HammerProjection);
    expect(registry.projections()).toContain(SceneProjection);
    expect(registry.projections()).toContain(HoleProjection);
    expect(registry.projections()).toContain(ShrewProjection);
    expect(registry.projections()).toContain(MonsterProjection);
    expect(registry.projections()).toContain(PerfHeroProjection);
    expect(registry.viewSyncs().map(sync => sync.name)).not.toContain("hammer");
    expect(registry.viewSyncs().map(sync => sync.name)).not.toContain("scene");
    expect(registry.viewSyncs().map(sync => sync.name)).not.toContain("hole");
    expect(registry.viewSyncs().map(sync => sync.name)).not.toContain("shrew");
  });

  it("显式装配九组洞位和地鼠固定拓扑", () => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, [SceneEntity, HoleEntity, ShrewEntity]);
    entities.bootstrapSingletons();
    const context = {
      world,
      entities,
      views: {
        mount: ({ create }: any) => create(),
        mountMany: (): any[] => [],
      },
      resources: {
        own: <T>(resource: T) => resource,
      },
    } as any;

    const result = setupCoreGameplay(context);

    expect(result.holes).toHaveLength(9);
    expect(result.shrews).toHaveLength(9);
    expect(result.holes.map(eid => HoleComponent.shrewEid[eid])).toEqual(result.shrews);
  });

  it("真实 feature setup 按模块创建并挂载完整运行时对象", () => {
    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {},
    });
    const world = createGameWorld();
    const entities = createEntityRuntime(world, GAME_FEATURE_REGISTRY.entityTypes());
    entities.bootstrapSingletons();
    const singletons = createSingletonEntities(world, {
      hammer: entities.one(HammerEntity),
    });
    const mounts = new Map<string, number>();
    const owned: object[] = [];
    const context = {
      world,
      root: null,
      singletons,
      perfConfig: getPerfTestRuntimeConfig(""),
      entities,
      views: {
        mount: ({ projection, create }: any) => {
          mounts.set(projection.name, (mounts.get(projection.name) ?? 0) + 1);
          return create();
        },
        mountMany: ({ eids, projection, create }: any) => {
          const nodes = [];
          for (let index = 0; index < eids.length; index++) {
            mounts.set(projection.name, (mounts.get(projection.name) ?? 0) + 1);
            nodes.push(create(eids[index], index));
          }
          return nodes;
        },
      },
      resources: {
        own: <T extends object>(resource: T) => {
          owned.push(resource);
          return resource;
        },
      },
      mount: (sync: ViewSyncModule, _eid: number, node: any) => {
        mounts.set(sync.name, (mounts.get(sync.name) ?? 0) + 1);
        return node;
      },
      own: <T extends { destroy(): void }>(resource: T) => {
        owned.push(resource);
        return resource;
      },
    } as FeatureSetupContext;

    try {
      GAME_FEATURE_REGISTRY.setupAll(context);
    } finally {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: originalWindow,
      });
    }

    expect(Object.fromEntries(mounts)).toEqual({
      scene: 1,
      hole: 9,
      shrew: 9,
      hammer: 1,
      player: 1,
      hit: 1,
      monster: MONSTER_SPAWN_RULES.reduce((count, rule) => count + rule.maxActiveCount, 0),
    });
    expect(owned).toEqual([]);
  });

  it("每帧查询复用预计算结果，避免 Registry 侧产生数组分配", () => {
    const registry = createGameFeatureRegistry([feature("featureA")]);

    expect(registry.systemsByPhase("feature")).toBe(registry.systemsByPhase("feature"));
    expect(registry.systemsByPhase("state")).toBe(registry.systemsByPhase("state"));
    expect(registry.dirtyAspects()).toBe(registry.dirtyAspects());
    expect(registry.viewSyncs()).toBe(registry.viewSyncs());
  });

  it("拒绝重复 system name，避免调试时难以定位顺序", () => {
    const first = feature("featureA");
    const second = feature("featureB");
    second.systems = first.systems;

    expect(() => validateGameFeatures([first, second]))
      .toThrow("FeatureSystem name 重复: featureA:system");
  });

  it("拒绝重复 feature name", () => {
    expect(() => validateGameFeatures([feature("same"), feature("same")]))
      .toThrow("GameFeature name 重复: same");
  });

  it("拒绝重复 view sync name", () => {
    const first = feature("featureA");
    const second = feature("featureB");
    second.viewSyncs = first.viewSyncs;

    expect(() => validateGameFeatures([first, second]))
      .toThrow("ViewSyncModule name 重复: featureA:sceneViewSync");
  });

  it("拒绝 ViewSyncModule 内部 dirtyTarget 不配对", () => {
    const broken: GameFeature = {
      name: "broken",
      viewSyncs: [
        {
          ...sceneViewSync,
          dirtyTarget: "playerDirty",
          dirtyArray: DirtyComponent.playerDirty,
        },
      ],
    };

    expect(() => validateGameFeatures([broken]))
      .toThrow("GameFeature broken 的 ViewSyncModule 未声明对应 dirtyTarget: sceneViewSync");
  });
});
