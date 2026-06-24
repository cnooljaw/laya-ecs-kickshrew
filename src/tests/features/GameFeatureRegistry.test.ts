import { describe, expect, it } from "vitest";
import { DirtyComponent } from "../../ecs/components";
import type { DirtyAspect } from "../../sync/dirty/DirtySchemaTypes";
import { system, type GameFeature } from "../../features/GameFeature";
import { GAME_FEATURES } from "../../features/GameFeatures";
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
