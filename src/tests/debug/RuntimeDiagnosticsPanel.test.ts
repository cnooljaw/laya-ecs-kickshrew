import { afterEach, describe, expect, it, vi } from "vitest";
import { RuntimeDiagnosticsPanel } from "../../debug/RuntimeDiagnosticsPanel";

class FakeText {
  text = "";
  color = "";
  fontSize = 0;
  font = "";
  leading = 0;
  x = 0;
  y = 0;
  zOrder = 0;
  destroyed = false;

  destroy(): void {
    this.destroyed = true;
  }
}

describe("RuntimeDiagnosticsPanel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the immutable schedule and the slowest frame steps", () => {
    const children: FakeText[] = [];
    vi.stubGlobal("window", {
      Laya: {
        Text: FakeText,
        stage: { addChild: (child: FakeText) => children.push(child) },
      },
    });
    const panel = new RuntimeDiagnosticsPanel(() => ({
      schedule: [
        { phase: "ingress", name: "session.networkIngress" },
        { phase: "state", name: "shrew.state" },
      ],
      frame: {
        frameCount: 3,
        lastFrameMs: 5,
        averageFrameMs: 4,
        maxFrameMs: 6,
        timings: [
          { scope: "state", name: "shrew.state", lastMs: 2, averageMs: 1.5, maxMs: 2, samples: 3 },
        ],
      },
    }));

    panel.show();

    expect(children[0].text).toContain("ECS frame 5.00ms");
    expect(children[0].text).toContain("schedule ingress: session.networkIngress");
    expect(children[0].text).toContain("schedule state: shrew.state");
    expect(children[0].text).toContain("state:shrew.state 2.00ms");
  });
});
