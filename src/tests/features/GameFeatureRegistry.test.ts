import { describe, expect, it } from "vitest";
import { getPerfTestRuntimeConfig } from "../../config/PerfTestConfig";
import { MONSTER_SPAWN_RULES } from "../../config/MonsterConfig";
import { DirtyComponent } from "../../ecs/components";
import { createGameWorld, createSingletonEntities } from "../../ecs/world";
import type { DirtyAspect } from "../../sync/dirty/DirtySchemaTypes";
import { system, type FeatureSetupContext, type GameFeature } from "../../features/GameFeature";
import { GAME_FEATURES, GAME_FEATURE_REGISTRY } from "../../features/GameFeatures";
import { createGameFeatureRegistry, validateGameFeatures } from "../../features/GameFeatureRegistry";
import type { ViewSyncModule } from "../../sync/viewSync/ViewSyncModule";

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

  it("真实 GAME_FEATURES 表能通过注册校验", () => {
    const registry = createGameFeatureRegistry(GAME_FEATURES);

    expect(registry.systemsByPhase("state").map(system => system.name)).toEqual([
      "animationTimerSystem",
      "shrewStateSystem",
      "sceneCycleSystem",
      "hammerSystem",
    ]);
    expect(registry.viewSyncs().map(sync => sync.name)).toContain("monster");
  });

  it("真实 feature setup 按模块创建并挂载完整运行时对象", () => {
    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {},
    });
    const world = createGameWorld();
    const singletons = createSingletonEntities(world);
    const mounts = new Map<string, number>();
    const owned: object[] = [];
    const context = {
      world,
      root: null,
      singletons,
      perfConfig: getPerfTestRuntimeConfig(""),
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
