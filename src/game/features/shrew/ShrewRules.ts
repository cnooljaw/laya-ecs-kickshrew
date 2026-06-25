export interface ShrewTiming {
  readonly waitMinSec: number;
  readonly waitMaxSec: number;
  readonly upDurationSec: number;
  readonly downDurationSec: number;
  readonly standSec: number;
  readonly dizzyHoldSec: number;
}

export const SHREW_TIMING: ShrewTiming = {
  waitMinSec: 1,
  waitMaxSec: 8,
  upDurationSec: 0.31,
  downDurationSec: 0.31,
  standSec: 2,
  dizzyHoldSec: 0.55,
};

export const PERF_SHREW_TIMING: ShrewTiming = {
  waitMinSec: 0.05,
  waitMaxSec: 0.2,
  upDurationSec: 0.08,
  downDurationSec: 0.08,
  standSec: 0.25,
  dizzyHoldSec: 0.15,
};

let shrewTimingOverride: ShrewTiming | null = null;

export function getShrewTiming(): ShrewTiming {
  return shrewTimingOverride ?? SHREW_TIMING;
}

export function setShrewTimingOverride(timing: ShrewTiming): void {
  shrewTimingOverride = timing;
}

export function resetShrewTimingOverride(): void {
  shrewTimingOverride = null;
}
