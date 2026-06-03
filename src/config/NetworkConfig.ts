export type NetworkMode = "websocket" | "mock";

export interface NetworkRuntimeConfig {
  mode: NetworkMode;
  serverUrl: string;
  timeoutMs: number;
}

declare global {
  interface Window {
    __KICKSHREW_NETWORK_CONFIG__?: Partial<NetworkRuntimeConfig>;
  }
}

export const DEFAULT_KICK_SERVER_URL = "ws://127.0.0.1:9000/ws";

export const DEFAULT_NETWORK_CONFIG: NetworkRuntimeConfig = {
  mode: "websocket",
  serverUrl: DEFAULT_KICK_SERVER_URL,
  timeoutMs: 3000,
};

export function getNetworkConfig(overrides?: Partial<NetworkRuntimeConfig>): NetworkRuntimeConfig {
  const runtimeConfig = getRuntimeConfig();
  const queryConfig = getQueryConfig();
  return mergeConfig(mergeConfig(mergeConfig(DEFAULT_NETWORK_CONFIG, runtimeConfig), queryConfig), overrides);
}

function getRuntimeConfig(): Partial<NetworkRuntimeConfig> | undefined {
  if (typeof window === "undefined") return undefined;
  return window.__KICKSHREW_NETWORK_CONFIG__;
}

function getQueryConfig(): Partial<NetworkRuntimeConfig> | undefined {
  if (typeof window === "undefined" || !window.location?.search) return undefined;

  const params = new URLSearchParams(window.location.search);
  const mode = params.get("networkMode");
  const timeoutMs = Number(params.get("networkTimeoutMs"));

  return {
    mode: mode === "mock" || mode === "websocket" ? mode : undefined,
    serverUrl: params.get("serverUrl") || undefined,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : undefined,
  };
}

function mergeConfig(
  base: NetworkRuntimeConfig,
  next?: Partial<NetworkRuntimeConfig>,
): NetworkRuntimeConfig {
  if (!next) return { ...base };
  return {
    mode: next.mode ?? base.mode,
    serverUrl: next.serverUrl ?? base.serverUrl,
    timeoutMs: next.timeoutMs ?? base.timeoutMs,
  };
}
