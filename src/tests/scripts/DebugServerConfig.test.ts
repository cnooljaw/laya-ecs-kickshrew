import { describe, expect, it } from "vitest";

const config = require("../../../scripts/debug-server-config.cjs") as {
  DEBUG_SERVER_HOST: string;
  DEBUG_SERVER_PORT: number;
  DEBUG_SERVER_LOCAL_CHECK_HOST: string;
  isLanReadyListenAddress: (address: string) => boolean;
};

describe("debug server config", () => {
  it("固定用 8080 绑定所有网卡，本机和局域网共用同一个端口", () => {
    expect(config.DEBUG_SERVER_HOST).toBe("0.0.0.0");
    expect(config.DEBUG_SERVER_LOCAL_CHECK_HOST).toBe("127.0.0.1");
    expect(config.DEBUG_SERVER_PORT).toBe(8080);
  });

  it("能区分局域网可访问监听和仅本机监听", () => {
    expect(config.isLanReadyListenAddress("*:8080")).toBe(true);
    expect(config.isLanReadyListenAddress("0.0.0.0:8080")).toBe(true);
    expect(config.isLanReadyListenAddress("[::]:8080")).toBe(true);
    expect(config.isLanReadyListenAddress("127.0.0.1:8080")).toBe(false);
    expect(config.isLanReadyListenAddress("localhost:8080")).toBe(false);
  });
});
