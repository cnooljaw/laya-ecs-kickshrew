interface BrowserMemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

const DEFAULT_X = 300;
const DEFAULT_Y = 0;
const UPDATE_INTERVAL_MS = 1000;
const BYTES_PER_MB = 1024 * 1024;

export class MemoryStatsPanel {
  private _text: any = null;
  private _peakUsedBytes = 0;

  show(x: number = DEFAULT_X, y: number = DEFAULT_Y): void {
    const Laya = getLaya();
    if (!Laya || this._text) return;

    this._text = new Laya.Text();
    this._text.text = "JS Heap --";
    this._text.color = "#00ff66";
    this._text.fontSize = 12;
    this._text.font = "monospace";
    this._text.leading = 2;
    this._text.x = x;
    this._text.y = y;
    this._text.zOrder = 99999;
    Laya.stage?.addChild?.(this._text);

    this.update();
    Laya.timer?.loop?.(UPDATE_INTERVAL_MS, this, this.update);
  }

  update(): void {
    if (!this._text) return;

    const memory = readBrowserMemory();
    if (!memory) {
      this._text.text = "JS Heap unavailable";
      return;
    }

    this._peakUsedBytes = Math.max(this._peakUsedBytes, memory.usedJSHeapSize);
    this._text.text =
      `JS Heap Used ${toMB(memory.usedJSHeapSize)} MB\n` +
      `Peak ${toMB(this._peakUsedBytes)} MB\n` +
      `Limit ${toMB(memory.jsHeapSizeLimit)} MB`;
  }

  destroy(): void {
    const Laya = getLaya();
    Laya?.timer?.clear?.(this, this.update);
    if (this._text) {
      this._text.destroy();
      this._text = null;
    }
  }
}

function getLaya(): any {
  return typeof window !== "undefined" ? (window as any).Laya : null;
}

function readBrowserMemory(): BrowserMemoryInfo | null {
  const runtimePerformance = typeof window !== "undefined"
    ? (window as any).performance
    : (globalThis as any).performance;
  const memory = runtimePerformance?.memory as BrowserMemoryInfo | undefined;
  if (!memory) return null;
  return memory;
}

function toMB(bytes: number): string {
  return (bytes / BYTES_PER_MB).toFixed(1);
}
