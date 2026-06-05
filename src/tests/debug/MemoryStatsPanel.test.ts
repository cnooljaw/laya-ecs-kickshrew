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

  it("显示浏览器 JS heap 使用量、峰值和上限，不显示会随 V8 扩容增长的 total heap", () => {
    const stage = new FakeStage();
    const memory = {
      usedJSHeapSize: 64 * 1024 * 1024,
      totalJSHeapSize: 96 * 1024 * 1024,
      jsHeapSizeLimit: 512 * 1024 * 1024,
    };
    vi.stubGlobal("window", {
      Laya: {
        Text: FakeText,
        stage,
      },
      performance: { memory },
    });

    const panel = new MemoryStatsPanel();

    panel.show(0, 84);
    panel.update();

    const text = stage.children[0] as FakeText;
    expect(text.text).toContain("JS Heap Used 64.0 MB");
    expect(text.text).toContain("Peak 64.0 MB");
    expect(text.text).toContain("Limit 512.0 MB");
    expect(text.text).not.toContain("96.0");

    memory.usedJSHeapSize = 48 * 1024 * 1024;
    panel.update();

    expect(text.text).toContain("JS Heap Used 48.0 MB");
    expect(text.text).toContain("Peak 64.0 MB");
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
