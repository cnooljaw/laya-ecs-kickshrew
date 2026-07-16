import { describe, expect, it } from "vitest";
import { createFrameDiagnostics } from "../../app/FrameDiagnostics";

describe("FrameDiagnostics", () => {
  it("records frame and individual pipeline step timings", () => {
    let clockMs = 0;
    const diagnostics = createFrameDiagnostics(() => clockMs);

    diagnostics.beginFrame();
    diagnostics.measure("state", "shrew.state", () => {
      clockMs += 2;
    });
    diagnostics.measure("runtime", "projection.sync", () => {
      clockMs += 3;
    });
    diagnostics.endFrame();

    const snapshot = diagnostics.snapshot();
    expect(snapshot).toMatchObject({
      frameCount: 1,
      lastFrameMs: 5,
      averageFrameMs: 5,
      maxFrameMs: 5,
    });
    expect(snapshot.timings).toEqual([
      expect.objectContaining({ scope: "state", name: "shrew.state", lastMs: 2, samples: 1 }),
      expect.objectContaining({ scope: "runtime", name: "projection.sync", lastMs: 3, samples: 1 }),
    ]);
  });

  it("records a measured step even when it throws", () => {
    let clockMs = 0;
    const diagnostics = createFrameDiagnostics(() => clockMs);

    diagnostics.beginFrame();
    expect(() => diagnostics.measure("gameplay", "monster.spawn", () => {
      clockMs += 4;
      throw new Error("boom");
    })).toThrow("boom");
    diagnostics.endFrame();

    expect(diagnostics.snapshot().timings[0]).toMatchObject({
      name: "monster.spawn",
      lastMs: 4,
    });
  });
});
