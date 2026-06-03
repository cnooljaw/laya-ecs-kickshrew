import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_KICK_SERVER_URL } from "../../config/NetworkConfig";
import { WebSocketTransport } from "../../network/WebSocketTransport";
import type { SocketMessageData } from "../../network/KickSocket";

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];

  binaryType = "";
  readyState = 0;
  sent: Uint8Array[] = [];
  onopen: ((event: unknown) => void) | null = null;
  onmessage: ((event: { data: SocketMessageData }) => void) | null = null;
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

  open(): void {
    this.readyState = 1;
    this.onopen?.({});
  }

  emitMessage(data: SocketMessageData): void {
    this.onmessage?.({ data });
  }
}

describe("WebSocketTransport", () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
  });

  it("连接配置的 WebSocket 地址并使用 arraybuffer 二进制模式", () => {
    const transport = new WebSocketTransport({
      url: DEFAULT_KICK_SERVER_URL,
      onMessage: () => {},
      WebSocketCtor: FakeWebSocket as any,
    });

    transport.connect();

    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(FakeWebSocket.instances[0].url).toBe("ws://127.0.0.1:9000/ws");
    expect(FakeWebSocket.instances[0].binaryType).toBe("arraybuffer");
  });

  it("连接打开前缓存发送数据，打开后按顺序发送", () => {
    const transport = new WebSocketTransport({
      url: DEFAULT_KICK_SERVER_URL,
      onMessage: () => {},
      WebSocketCtor: FakeWebSocket as any,
    });

    const first = new Uint8Array([1]);
    const second = new Uint8Array([2]);
    transport.send(first);
    transport.send(second);

    const socket = FakeWebSocket.instances[0];
    expect(socket.sent).toEqual([]);

    socket.open();

    expect(socket.sent).toEqual([first, second]);
  });

  it("收到二进制回包后转发给上层 onMessage", () => {
    const messages: SocketMessageData[] = [];
    const transport = new WebSocketTransport({
      url: DEFAULT_KICK_SERVER_URL,
      onMessage: (data) => messages.push(data),
      WebSocketCtor: FakeWebSocket as any,
    });

    transport.connect();
    const payload = new Uint8Array([9, 8, 7]).buffer;
    FakeWebSocket.instances[0].emitMessage(payload);

    expect(messages).toEqual([payload]);
  });
});
