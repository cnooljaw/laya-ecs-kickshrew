import type { GameSystemPhase } from "../framework/feature/FeatureManifest";

export type FrameDiagnosticScope = GameSystemPhase | "runtime";

export interface FrameTiming {
  readonly scope: FrameDiagnosticScope;
  readonly name: string;
  readonly lastMs: number;
  readonly averageMs: number;
  readonly maxMs: number;
  readonly samples: number;
}

export interface FrameDiagnosticsSnapshot {
  readonly frameCount: number;
  readonly lastFrameMs: number;
  readonly averageFrameMs: number;
  readonly maxFrameMs: number;
  readonly timings: readonly FrameTiming[];
}

export interface FrameDiagnostics {
  beginFrame(): void;
  measure<T>(scope: FrameDiagnosticScope, name: string, work: () => T): T;
  endFrame(): void;
  snapshot(): FrameDiagnosticsSnapshot;
}

interface MutableTiming {
  scope: FrameDiagnosticScope;
  name: string;
  lastMs: number;
  totalMs: number;
  maxMs: number;
  samples: number;
}

export function createFrameDiagnostics(now: () => number = defaultNow): FrameDiagnostics {
  const timings = new Map<string, MutableTiming>();
  let frameStartedAt = 0;
  let frameCount = 0;
  let lastFrameMs = 0;
  let totalFrameMs = 0;
  let maxFrameMs = 0;

  function record(scope: FrameDiagnosticScope, name: string, elapsedMs: number): void {
    const key = `${scope}:${name}`;
    let timing = timings.get(key);
    if (!timing) {
      timing = {
        scope,
        name,
        lastMs: 0,
        totalMs: 0,
        maxMs: 0,
        samples: 0,
      };
      timings.set(key, timing);
    }
    timing.lastMs = elapsedMs;
    timing.totalMs += elapsedMs;
    timing.maxMs = Math.max(timing.maxMs, elapsedMs);
    timing.samples += 1;
  }

  return {
    beginFrame: () => {
      frameStartedAt = now();
    },
    measure: (scope, name, work) => {
      const startedAt = now();
      try {
        return work();
      } finally {
        record(scope, name, now() - startedAt);
      }
    },
    endFrame: () => {
      lastFrameMs = now() - frameStartedAt;
      totalFrameMs += lastFrameMs;
      maxFrameMs = Math.max(maxFrameMs, lastFrameMs);
      frameCount += 1;
    },
    snapshot: () => ({
      frameCount,
      lastFrameMs,
      averageFrameMs: frameCount === 0 ? 0 : totalFrameMs / frameCount,
      maxFrameMs,
      timings: Array.from(timings.values(), timing => ({
        scope: timing.scope,
        name: timing.name,
        lastMs: timing.lastMs,
        averageMs: timing.totalMs / timing.samples,
        maxMs: timing.maxMs,
        samples: timing.samples,
      })),
    }),
  };
}

function defaultNow(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}
