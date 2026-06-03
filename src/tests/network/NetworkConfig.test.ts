import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_KICK_SERVER_URL,
  getNetworkConfig,
} from "../../config/NetworkConfig";

describe("NetworkConfig", () => {
  const originalWindow = (globalThis as any).window;

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as any).window;
    } else {
      (globalThis as any).window = originalWindow;
    }
  });

  it("默认连接 Go WebSocket 服务地址", () => {
    expect(DEFAULT_KICK_SERVER_URL).toBe("ws://127.0.0.1:9000/ws");
    expect(getNetworkConfig()).toEqual({
      mode: "websocket",
      serverUrl: "ws://127.0.0.1:9000/ws",
      timeoutMs: 3000,
    });
  });

  it("允许通过浏览器全局配置覆盖服务地址和模式", () => {
    (globalThis as any).window = {
      __KICKSHREW_NETWORK_CONFIG__: {
        mode: "mock",
        serverUrl: "ws://127.0.0.1:9100/custom",
        timeoutMs: 5000,
      },
    };

    expect(getNetworkConfig()).toEqual({
      mode: "mock",
      serverUrl: "ws://127.0.0.1:9100/custom",
      timeoutMs: 5000,
    });
  });

  it("显式参数优先于浏览器全局配置", () => {
    (globalThis as any).window = {
      __KICKSHREW_NETWORK_CONFIG__: {
        mode: "mock",
        serverUrl: "ws://127.0.0.1:9100/custom",
      },
    };

    expect(getNetworkConfig({ mode: "websocket" })).toEqual({
      mode: "websocket",
      serverUrl: "ws://127.0.0.1:9100/custom",
      timeoutMs: 3000,
    });
  });

  it("允许通过调试页 URL 参数覆盖连接配置", () => {
    (globalThis as any).window = {
      location: {
        search: "?serverUrl=ws%3A%2F%2F127.0.0.1%3A9200%2Fws&networkMode=mock&networkTimeoutMs=4500",
      },
    };

    expect(getNetworkConfig()).toEqual({
      mode: "mock",
      serverUrl: "ws://127.0.0.1:9200/ws",
      timeoutMs: 4500,
    });
  });
});
