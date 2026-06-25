import { afterEach, describe, expect, it, vi } from "vitest";
import { HammerNode } from "../../game/features/hammer/HammerNode";

class FakeSprite {
  name = "";
  zOrder = 0;
  rotation = 0;
  numChildren = 0;
  graphics = {
    clear: vi.fn(),
    drawTexture: vi.fn(),
  };

  addChild(): void {
    this.numChildren++;
  }

  setChildIndex(): void {}
  pos(): void {}
  destroy(): void {}
}

describe("HammerNode lifecycle", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("销毁时清理锤子 tween，避免未完成动画保留节点", () => {
    const tweenClearAll = vi.fn();
    vi.stubGlobal("window", {
      Laya: {
        Sprite: FakeSprite,
        Tween: {
          to: vi.fn(),
          clearAll: tweenClearAll,
        },
        Handler: {
          create: vi.fn((_caller, method) => method),
        },
      },
    });

    const node = new HammerNode();
    node.create(new FakeSprite());
    node.playHitAnimation();

    node.destroy();

    expect(tweenClearAll).toHaveBeenCalledWith(expect.any(FakeSprite));
  });
});
