let offsetMs = 0;
let initialized = false;

export function setServerClockSample(serverTimeMs: number, clientReceiveMs: number = Date.now()): void {
  offsetMs = serverTimeMs - clientReceiveMs;
  initialized = true;
}

export function getServerNowMs(): number {
  return Date.now() + offsetMs;
}

export function hasServerClockSample(): boolean {
  return initialized;
}

export function resetServerGameClock(): void {
  offsetMs = 0;
  initialized = false;
}
