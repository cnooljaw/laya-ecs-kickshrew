import { describe, expect, it } from "vitest";
import type { DirtyAspect } from "../../ecs/dirty/DirtySchemaTypes";
import type { GameFeature } from "../../features/GameFeature";
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
    systems: [() => {}],
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

    expect(registry.systems()).toHaveLength(1);
    expect(registry.dirtyAspects()).toEqual([sceneAspect]);
    expect(registry.syncChannels().map(channel => channel.name)).toEqual(["featureA:scene"]);
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
