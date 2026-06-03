import { beforeEach, describe, expect, it } from "vitest";
import { NetworkAdapter } from "../../network/NetworkAdapter";

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];

  binaryType = "";
  readyState = 0;
  sent: Uint8Array[] = [];
  onopen: ((event: unknown) => void) | null = null;
  onmessage: ((event: { data: ArrayBuffer }) => void) | null = null;
  onclose: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;

  constructor(public readonly url: string) {
    FakeWebSocket.instances.push(this);
  }

  send(data: Uint8Array): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = 3;
    this.onclose?.({});
  }
}

describe("NetworkAdapter", () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
  });

  it("按配置创建并连接真实 WebSocket transport", () => {
    const adapter = new NetworkAdapter({
      config: {
        mode: "websocket",
        serverUrl: "ws://127.0.0.1:9000/ws",
      },
      WebSocketCtor: FakeWebSocket as any,
    });

    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(FakeWebSocket.instances[0].url).toBe("ws://127.0.0.1:9000/ws");

    adapter.destroy();
  });

  it("mock 模式保留本地 protobuf 回环链路", async () => {
    const adapter = new NetworkAdapter({
      config: { mode: "mock" },
    });

    const resp = await adapter.sendKick({
      cmd: "kick",
      hammerType: 1,
      bKickShrew: 1,
      numOfShrew: 1,
      shrews: [{ shrewindex: 1, protectType: 0 }],
      comboID: 0,
    });

    expect(resp.seqId).toBe(1);
    expect(resp.ret).toBe(0);
    expect(resp.shrewResp).toHaveLength(1);

    adapter.destroy();
  });
});
