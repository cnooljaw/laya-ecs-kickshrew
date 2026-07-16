import { afterEach, describe, expect, it, vi } from "vitest";
import { createClientDiagnostics } from "../../app/ClientDiagnostics";
import type { GameScene } from "../../app/GameScene";

class FakeText {
  text = "";
  destroy(): void {}
}

describe("ClientDiagnostics", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is a no-op by default, so the application does not create frame diagnostics or Laya overlays", () => {
    const statShow = vi.fn();
    vi.stubGlobal("window", { Laya: { Stat: { show: statShow } } });

    const diagnostics = createClientDiagnostics();
    diagnostics.attach({} as GameScene);

    expect(diagnostics.frameDiagnostics).toBeUndefined();
    expect(statShow).not.toHaveBeenCalled();
  });

  it("owns Stat, memory and ECS panels together when explicitly enabled", () => {
    const statShow = vi.fn();
    const statHide = vi.fn();
    const timerClear = vi.fn();
    const children: FakeText[] = [];
    vi.stubGlobal("window", {
      Laya: {
        Stat: { show: statShow, hide: statHide },
        Text: FakeText,
        stage: { addChild: (child: FakeText) => children.push(child) },
        timer: { clear: timerClear },
      },
      performance: {},
    });
    const diagnostics = createClientDiagnostics({ enabled: true });

    diagnostics.attach({ getRuntimeDebugInfo: () => null } as GameScene);
    diagnostics.destroy();

    expect(diagnostics.frameDiagnostics).toBeDefined();
    expect(statShow).toHaveBeenCalledWith(0, 0);
    expect(children).toHaveLength(2);
    expect(statHide).toHaveBeenCalledOnce();
    expect(timerClear).toHaveBeenCalledTimes(2);
  });
});
