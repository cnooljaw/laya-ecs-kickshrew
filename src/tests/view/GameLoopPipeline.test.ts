import { describe, expect, it } from "vitest";
import type { GameFeatureRuntime } from "../../framework/feature/FeatureRegistry";
import { GameLoopPipeline } from "../../app/GameLoopPipeline";

describe("GameLoopPipeline", () => {
  it("固定执行 state -> network -> feature -> projection sync -> effects", () => {
    const order: string[] = [];
    const featureRuntime: GameFeatureRuntime = {
      systemsByPhase: phase => phase === "state"
        ? [{ phase: "state", name: "state", run: () => order.push("state") }]
        : [{ phase: "feature", name: "feature", run: () => order.push("feature") }],
    };
    const pipeline = new GameLoopPipeline({
      world: {},
      featureRuntime,
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
