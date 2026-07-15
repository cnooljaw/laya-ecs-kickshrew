import { describe, expect, it } from "vitest";
import type { GameFeatureRuntime } from "../../framework/feature/FeatureRegistry";
import { GameLoopPipeline } from "../../app/GameLoopPipeline";

describe("GameLoopPipeline", () => {
  it("固定执行 network -> ingress -> state -> gameplay -> derived -> projection sync -> effects", () => {
    const order: string[] = [];
    const featureRuntime: GameFeatureRuntime = {
      systemsByPhase: phase => [{
        phase,
        name: phase,
        run: () => order.push(phase),
      }],
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
      "network",
      "ingress",
      "state",
      "gameplay",
      "derived",
      "projectionMark",
      "projectionSync",
      "effects",
    ]);
  });

  it("runs one requested structural rebuild after derived systems and before projection", () => {
    const order: string[] = [];
    const featureRuntime: GameFeatureRuntime = {
      systemsByPhase: phase => [{
        phase,
        name: phase,
        run: () => order.push(phase),
      }],
    };
    const pipeline = new GameLoopPipeline({
      world: {},
      featureRuntime,
      network: { update: () => order.push("network") } as any,
      rebuild: () => order.push("rebuild"),
      projectionRuntime: {
        mark: () => order.push("projectionMark"),
        sync: () => order.push("projectionSync"),
      },
    });

    pipeline.update(1 / 60);
    expect(order).not.toContain("rebuild");

    pipeline.requestRebuild();
    pipeline.update(1 / 60);

    expect(order.slice(-8)).toEqual([
      "network",
      "ingress",
      "state",
      "gameplay",
      "derived",
      "rebuild",
      "projectionMark",
      "projectionSync",
    ]);
  });
});
