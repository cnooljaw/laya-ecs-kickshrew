import { PERF_SHREW_TIMING } from "./GameTuning";
import { PERF_LADYBIRD_VIEW_LAYOUT } from "./ViewLayoutConfig";

export interface PerfTestRuntimeConfig {
  enabled: boolean;
  shrewFast: boolean;
  ladybirdCount: number;
}

export function getPerfTestRuntimeConfig(search?: string): PerfTestRuntimeConfig {
  const query = search ?? getRuntimeSearch();
  const params = new URLSearchParams(query);
  const enabled = params.get("perf") === "1";
  const shrewFast = enabled && params.get("shrewFast") !== "0";
  const ladybirdCount = enabled ? readCount(params) : 0;

  return { enabled, shrewFast, ladybirdCount };
}

export function getPerfShrewTiming() {
  return PERF_SHREW_TIMING;
}

function readCount(params: URLSearchParams): number {
  const raw = params.get("ladybirds") ?? params.get("bugs");
  const fallback = PERF_LADYBIRD_VIEW_LAYOUT.defaultCount;
  const parsed = raw ? Number.parseInt(raw, 10) : fallback;
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.min(parsed, PERF_LADYBIRD_VIEW_LAYOUT.maxCount);
}

function getRuntimeSearch(): string {
  const maybeWindow = typeof window !== "undefined" ? window : null;
  return maybeWindow?.location?.search ?? "";
}
