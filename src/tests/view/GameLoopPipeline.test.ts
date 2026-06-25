import { describe, expect, it } from "vitest";
import type { GameFeatureRegistry } from "../../features/GameFeatureRegistry";
import { GameLoopPipeline } from "../../view/GameLoopPipeline";

describe("GameLoopPipeline", () => {
  it("固定执行 state -> network -> feature -> projection sync -> effects", () => {
    const order: string[] = [];
    const featureRegistry: GameFeatureRegistry = {
      setupAll: () => {},
      systemsByPhase: phase => phase === "state"
        ? [{ name: "state", run: () => order.push("state") }]
        : [{ name: "feature", run: () => order.push("feature") }],
      entityTypes: () => [],
      projections: () => [],
    };
    const pipeline = new GameLoopPipeline({
      world: {},
      featureRegistry,
      network: { update: () => order.push("network") } as any,
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
      "projectionMark",
      "projectionSync",
      "effects",
    ]);
  });
});
