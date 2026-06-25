import { describe, expect, it } from "vitest";
import type { DirtyAspect } from "../../sync/dirty/DirtySchemaTypes";
import type { GameFeatureRegistry } from "../../features/GameFeatureRegistry";
import { GameLoopPipeline } from "../../view/GameLoopPipeline";

describe("GameLoopPipeline", () => {
  it("固定执行 state -> network -> feature -> legacy sync -> projection sync -> effects", () => {
    const order: string[] = [];
    const aspect: DirtyAspect = {
      name: "test",
      description: "test",
      requires: [],
      query: () => {
        order.push("dirty");
        return [];
      },
      channels: [],
    };
    const featureRegistry: GameFeatureRegistry = {
      setupAll: () => {},
      systemsByPhase: phase => phase === "state"
        ? [{ phase: "state", name: "state", run: () => order.push("state") }]
        : [{ phase: "feature", name: "feature", run: () => order.push("feature") }],
      entityTypes: () => [],
      projections: () => [],
      dirtyAspects: () => [aspect],
      viewSyncs: () => [],
    };
    const pipeline = new GameLoopPipeline({
      world: {},
      featureRegistry,
      network: { update: () => order.push("network") } as any,
      syncView: { sync: () => order.push("viewSync") } as any,
      projectionRuntime: {
        mark: () => order.push("projectionMark"),
        sync: () => order.push("projectionSync"),
      },
      effects: {
        flush: () => order.push("effects"),
      },
    });

    pipeline.update(1 / 60);

    expect(order).toEqual([
      "state",
      "network",
      "feature",
      "dirty",
      "viewSync",
      "projectionMark",
      "projectionSync",
      "effects",
    ]);
  });
});
