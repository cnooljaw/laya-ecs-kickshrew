import { afterEach, describe, expect, it, vi } from "vitest";
import { Main } from "../app/Main";

const mocks = vi.hoisted(() => {
  const frameLoop = vi.fn();
  const clear = vi.fn();
  const stageOn = vi.fn();
  const stageOff = vi.fn();
  const destroy = vi.fn();

  (globalThis as any).Laya = {
    Script: class {},
    regClass: () => (target: unknown) => target,
    Stat: { show: vi.fn() },
    timer: {
      delta: 16,
      frameLoop,
      clear,
    },
    stage: {
      mouseX: 0,
      mouseY: 0,
      on: stageOn,
      off: stageOff,
    },
    Event: { MOUSE_DOWN: "mousedown" },
  };

  return { frameLoop, clear, stageOn, stageOff, destroy };
});

vi.mock("../app/GameScene", () => ({
  GameScene: class {
    init = vi.fn();
    start = vi.fn();
    update = vi.fn();
    onTouch = vi.fn();
    destroy = mocks.destroy;
  },
}));

describe("Main lifecycle", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("销毁时注销帧循环和 stage 输入事件，避免旧场景被 Laya 回调保留", async () => {
    const main = new Main();

    main.onStart();
    main.onDestroy();

    expect(mocks.frameLoop).toHaveBeenCalledTimes(1);
    expect(mocks.clear).toHaveBeenCalledWith(main, expect.any(Function));
    expect(mocks.stageOn).toHaveBeenCalledWith("mousedown", main, expect.any(Function));
    expect(mocks.stageOff).toHaveBeenCalledWith("mousedown", main, expect.any(Function));
    expect(mocks.destroy).toHaveBeenCalledTimes(1);
  });
});
