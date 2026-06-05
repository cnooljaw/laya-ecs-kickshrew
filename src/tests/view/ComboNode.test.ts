import { afterEach, describe, expect, it, vi } from "vitest";
import { ComboNode } from "../../view/ComboNode";

class FakeSprite {
  children: unknown[] = [];
  numChildren = 0;
  visible = true;
  zOrder = 0;

  addChild(child: unknown): void {
    this.children.push(child);
    this.numChildren = this.children.length;
  }

  setChildIndex(): void {}

  destroy(): void {
    this.children = [];
    this.numChildren = 0;
  }
}

class FakeText extends FakeSprite {
  text = "";
  color = "";
  fontSize = 0;
  bold = false;
  x = 0;
  y = 0;
  anchorX = 0;
  anchorY = 0;
}

describe("ComboNode lifecycle", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("销毁时清理隐藏 timer，避免 timer 回调继续保留 ComboNode", () => {
    const timerClear = vi.fn();
    vi.stubGlobal("window", {
      Laya: {
        Sprite: FakeSprite,
        Text: FakeText,
        timer: {
          once: vi.fn(),
          clear: timerClear,
        },
      },
    });

    const node = new ComboNode();
    node.create(new FakeSprite());
    node.showCombo(2, [1, 2]);

    node.destroy();

    expect(timerClear).toHaveBeenCalledWith(node, expect.any(Function));
  });
});
