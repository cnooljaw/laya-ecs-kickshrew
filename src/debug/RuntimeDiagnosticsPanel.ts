import type { GameRuntimeDebugInfo } from "../app/GameScene";

const DEFAULT_X = 300;
const DEFAULT_Y = 60;
const UPDATE_INTERVAL_MS = 1000;
const MAX_TIMINGS = 8;

export class RuntimeDiagnosticsPanel {
  private _text: any = null;

  constructor(private readonly _read: () => GameRuntimeDebugInfo | null) {}

  show(x: number = DEFAULT_X, y: number = DEFAULT_Y): void {
    const Laya = getLaya();
    if (!Laya || this._text) return;

    this._text = new Laya.Text();
    this._text.color = "#7fdbff";
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
    const info = this._read();
    if (!info) {
      this._text.text = "ECS schedule pending";
      return;
    }

    const schedule = formatSchedule(info.schedule);
    const timings = [...info.frame.timings]
      .sort((left, right) => right.lastMs - left.lastMs)
      .slice(0, MAX_TIMINGS)
      .map(item => `${item.scope}:${item.name} ${item.lastMs.toFixed(2)}ms`)
      .join("\n");
    this._text.text =
      `ECS frame ${info.frame.lastFrameMs.toFixed(2)}ms ` +
      `(avg ${info.frame.averageFrameMs.toFixed(2)} / max ${info.frame.maxFrameMs.toFixed(2)})\n` +
      `${schedule}\n` +
      (timings || "No frame samples");
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

function formatSchedule(schedule: readonly GameRuntimeDebugInfo["schedule"][number][]): string {
  const byPhase = new Map<string, string[]>();
  for (const item of schedule) {
    const names = byPhase.get(item.phase) ?? [];
    names.push(item.name);
    byPhase.set(item.phase, names);
  }
  return Array.from(byPhase, ([phase, names]) => `schedule ${phase}: ${names.join(" -> ")}`).join("\n");
}
