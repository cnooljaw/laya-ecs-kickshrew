import { afterEach, describe, expect, it, vi } from "vitest";
import { SceneLayer } from "../../view/SceneLayer";

class FakeSprite {
  children: FakeSprite[] = [];
  alpha = 1;
  zOrder = 0;
  y = 0;
  destroyed = false;
  graphics = {
    clear: vi.fn(),
    drawRect: vi.fn(),
    drawTexture: vi.fn(),
  };

  addChild(child: FakeSprite): void {
    this.children.push(child);
  }

  destroy(): void {
    this.destroyed = true;
    this.children = [];
  }
}

describe("SceneLayer lifecycle", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("销毁时清理未完成的转场 mask tween 和节点", () => {
    const tweenClearAll = vi.fn();
    vi.stubGlobal("window", {
      Laya: {
        Sprite: FakeSprite,
        Tween: {
          to: vi.fn(() => ({ then: vi.fn() })),
          clearAll: tweenClearAll,
        },
      },
    });

    const parent = new FakeSprite();
    const layer = new SceneLayer();
    layer.create(parent);

    layer.setTransitioning(true);
    const mask = parent.children[1];

    layer.destroy();

    expect(tweenClearAll).toHaveBeenCalledWith(mask);
    expect(mask.destroyed).toBe(true);
  });
});
