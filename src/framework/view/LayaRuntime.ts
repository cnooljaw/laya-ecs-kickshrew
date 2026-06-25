export function getLaya(): any | null {
  const runtimeWindow = globalThis.window as any;
  return runtimeWindow?.Laya ?? null;
}
