import { describe, expect, it } from "vitest";
import type { GameFeatureRuntime } from "../../framework/feature/FeatureRegistry";
import { GameLoopPipeline } from "../../app/GameLoopPipeline";
import { createFrameDiagnostics } from "../../app/FrameDiagnostics";

describe("GameLoopPipeline", () => {
  it("固定执行 network -> ingress -> state -> gameplay -> derived -> projection sync -> effects", () => {
    const order: string[] = [];
    const featureRuntime: GameFeatureRuntime = {
      systemsByPhase: phase => [{
        phase,
        name: phase,
        run: () => order.push(phase),
      }],
      schedule: () => [],
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
      schedule: () => [],
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

  it("reports system and runtime step timings without changing schedule execution", () => {
    let clockMs = 0;
    const diagnostics = createFrameDiagnostics(() => clockMs);
    const featureRuntime: GameFeatureRuntime = {
      systemsByPhase: phase => [{
        phase,
        name: `${phase}.system`,
        run: () => { clockMs += 1; },
      }],
      schedule: () => [],
    };
    const pipeline = new GameLoopPipeline({
      world: {},
      featureRuntime,
      network: { update: () => { clockMs += 2; } } as any,
      diagnostics,
    });

    pipeline.update(1 / 60);

    expect(diagnostics.snapshot().timings).toEqual(expect.arrayContaining([
      expect.objectContaining({ scope: "runtime", name: "network.update", lastMs: 2 }),
      expect.objectContaining({ scope: "state", name: "state.system", lastMs: 1 }),
      expect.objectContaining({ scope: "derived", name: "derived.system", lastMs: 1 }),
    ]));
  });
});
