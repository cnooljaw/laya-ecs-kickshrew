let offsetMs = 0;
let initialized = false;
let bestRoundTripMs = Number.POSITIVE_INFINITY;

export function setServerClockSample(
  serverTimeMs: number,
  clientMidpointMs: number = Date.now(),
  roundTripMs: number = Number.POSITIVE_INFINITY,
): void {
  if (initialized && roundTripMs > bestRoundTripMs) return;
  offsetMs = serverTimeMs - clientMidpointMs;
  bestRoundTripMs = roundTripMs;
  initialized = true;
}

export function getServerNowMs(): number {
  return Date.now() + offsetMs;
}

export function hasServerClockSample(): boolean {
  return initialized;
}

export function resetServerClock(): void {
  offsetMs = 0;
  initialized = false;
  bestRoundTripMs = Number.POSITIVE_INFINITY;
}
