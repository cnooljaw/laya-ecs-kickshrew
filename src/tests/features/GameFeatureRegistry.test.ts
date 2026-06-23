import { describe, expect, it } from "vitest";
import type { DirtyAspect } from "../../sync/dirty/DirtySchemaTypes";
import { system, type GameFeature } from "../../features/GameFeature";
import { GAME_FEATURES } from "../../features/GameFeatures";
import { createGameFeatureRegistry, validateGameFeatures } from "../../features/GameFeatureRegistry";

const sceneAspect: DirtyAspect = {
  name: "sceneAspect",
  description: "test scene dirty aspect",
  requires: [],
  query: () => [],
  channels: [
    {
      name: "scene",
      storeKey: "scene",
      dirtyTarget: "sceneDirty",
      allBits: 0x01,
      marks: [],
    },
  ],
};

function feature(name: string): GameFeature {
  return {
    name,
    systems: [system("feature", `${name}:system`, () => {})],
    dirtyAspects: [sceneAspect],
    syncChannels: [
      {
        name: `${name}:scene`,
        dirtyTarget: "sceneDirty",
        mask: 0x01,
        binding: () => {},
      },
    ],
  };
}

describe("GameFeatureRegistry", () => {
  it("集中展开 feature systems、dirty aspects 和 sync channels", () => {
    const registry = createGameFeatureRegistry([feature("featureA")]);

    expect(registry.systemsByPhase("feature")).toHaveLength(1);
    expect(registry.systemsByPhase("state")).toEqual([]);
    expect(registry.dirtyAspects()).toEqual([sceneAspect]);
    expect(registry.syncChannels().map(channel => channel.name)).toEqual(["featureA:scene"]);
  });

  it("真实 GAME_FEATURES 表能通过注册校验", () => {
    const registry = createGameFeatureRegistry(GAME_FEATURES);

    expect(registry.systemsByPhase("state").map(system => system.name)).toEqual([
      "animationTimerSystem",
      "shrewStateSystem",
      "sceneCycleSystem",
      "hammerSystem",
    ]);
    expect(registry.syncChannels().map(channel => channel.name)).toContain("monster");
  });

  it("每帧查询复用预计算结果，避免 Registry 侧产生数组分配", () => {
    const registry = createGameFeatureRegistry([feature("featureA")]);

    expect(registry.systemsByPhase("feature")).toBe(registry.systemsByPhase("feature"));
    expect(registry.systemsByPhase("state")).toBe(registry.systemsByPhase("state"));
    expect(registry.dirtyAspects()).toBe(registry.dirtyAspects());
    expect(registry.syncChannels()).toBe(registry.syncChannels());
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

  it("拒绝重复 sync channel name", () => {
    const first = feature("featureA");
    const second = feature("featureB");
    second.syncChannels = first.syncChannels;

    expect(() => validateGameFeatures([first, second]))
      .toThrow("SyncChannel name 重复: featureA:scene");
  });

  it("拒绝只注册 dirtyAspect 但没有对应 syncChannel 的 feature", () => {
    const broken: GameFeature = {
      name: "broken",
      dirtyAspects: [sceneAspect],
      syncChannels: [],
    };

    expect(() => validateGameFeatures([broken]))
      .toThrow("GameFeature broken 的 dirtyTarget 未注册 SyncChannel: sceneDirty");
  });
});
