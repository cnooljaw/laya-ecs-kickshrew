import { PERF_SHREW_TIMING } from "../../../config/GameTuning";
import { PERF_HERO_VIEW_CONFIG } from "./PerfHeroViewConfig";

export interface PerfTestRuntimeConfig {
  enabled: boolean;
  shrewFast: boolean;
  heroCount: number;
}

export function getPerfTestRuntimeConfig(search?: string): PerfTestRuntimeConfig {
  const query = search ?? getRuntimeSearch();
  const params = new URLSearchParams(query);
  const enabled = params.get("perf") === "1";
  const shrewFast = enabled && params.get("shrewFast") !== "0";
  const heroCount = enabled ? readCount(params) : 0;

  return { enabled, shrewFast, heroCount };
}

export function getPerfShrewTiming() {
  return PERF_SHREW_TIMING;
}

function readCount(params: URLSearchParams): number {
  const raw = params.get("heroes") ?? params.get("heroCount");
  const fallback = PERF_HERO_VIEW_CONFIG.defaultCount;
  const parsed = raw ? Number.parseInt(raw, 10) : fallback;
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.min(parsed, PERF_HERO_VIEW_CONFIG.maxCount);
}

function getRuntimeSearch(): string {
  const maybeWindow = typeof window !== "undefined" ? window : null;
  return maybeWindow?.location?.search ?? "";
}
