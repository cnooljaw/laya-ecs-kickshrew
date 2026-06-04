import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryStatsPanel } from "../../debug/MemoryStatsPanel";

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

class FakeStage {
  children: unknown[] = [];

  addChild(child: unknown): void {
    this.children.push(child);
  }
}

describe("MemoryStatsPanel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("显示浏览器 JS heap 使用量和上限", () => {
    const stage = new FakeStage();
    vi.stubGlobal("window", {
      Laya: {
        Text: FakeText,
        stage,
      },
      performance: {
        memory: {
          usedJSHeapSize: 64 * 1024 * 1024,
          totalJSHeapSize: 96 * 1024 * 1024,
          jsHeapSizeLimit: 512 * 1024 * 1024,
        },
      },
    });

    const panel = new MemoryStatsPanel();

    panel.show(0, 84);
    panel.update();

    const text = stage.children[0] as FakeText;
    expect(text.text).toContain("JS Heap 64.0 / 96.0 MB");
    expect(text.text).toContain("Limit 512.0 MB");
  });

  it("销毁时清理 Laya timer 和文本节点", () => {
    const timerClear = vi.fn();
    const stage = new FakeStage();
    vi.stubGlobal("window", {
      Laya: {
        Text: FakeText,
        stage,
        timer: { clear: timerClear },
      },
      performance: {},
    });

    const panel = new MemoryStatsPanel();
    panel.show();
    const text = stage.children[0] as FakeText;

    panel.destroy();

    expect(timerClear).toHaveBeenCalledWith(panel, panel.update);
    expect(text.destroyed).toBe(true);
  });
});
