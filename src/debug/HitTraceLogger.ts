export interface HitTraceLogger {
  log(event: string, payload?: Record<string, unknown>): void;
}

declare global {
  interface Window {
    __KICKSHREW_HIT_TRACE__?: boolean;
  }
}

const PREFIX = "[HitTrace]";

export const consoleHitTraceLogger: HitTraceLogger = {
  log(event: string, payload: Record<string, unknown> = {}): void {
    if (!isHitTraceEnabled()) return;
    console.log(PREFIX, event, payload);
  },
};

export function isHitTraceEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof window.__KICKSHREW_HIT_TRACE__ === "boolean") {
    return window.__KICKSHREW_HIT_TRACE__;
  }

  const params = new URLSearchParams(window.location?.search ?? "");
  const value = params.get("hitTrace");
  if (value === "0" || value === "false") return false;
  if (value === "1" || value === "true") return true;
  return true;
}

export function actionStateName(actionState: number): string {
  switch (actionState) {
    case 1: return "Wait";
    case 2: return "Up";
    case 3: return "Stand";
    case 4: return "Down";
    case 5: return "Dizzy";
    default: return `Unknown(${actionState})`;
  }
}

export function animTypeName(animType: number): string {
  switch (animType) {
    case 0: return "Idle";
    case 1: return "Up";
    case 2: return "Stand";
    case 3: return "Down";
    case 4: return "Dizzy";
    case 5: return "HatBreak";
    case 6: return "Swelling";
    case 7: return "HammerEffect";
    case 8: return "ComboLightning";
    case 9: return "TreasureBox";
    default: return `Unknown(${animType})`;
  }
}
