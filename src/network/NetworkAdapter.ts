/**
 * NetworkAdapter — Socket 事件 ↔ ECS NetworkComponent 桥梁
 *
 * 职责:
 * 1. 持有 KickSocket 和 MockServer 实例
 * 2. 将 KickSocket 收到的回包转发给 HitResponseSystem
 * 3. 将 HitDetectionSystem 的击中结果通过 KickSocket 发送
 * 4. 每帧调用 checkTimeout
 *
 * 依赖 Laya 运行时（触摸事件），不在 vitest 中测试
 */
import { KickSocket, ISocketTransport } from "./KickSocket";
import { MockServer } from "./MockServer";
import { WebSocketTransport, WebSocketCtorLike } from "./WebSocketTransport";
import type { KickRequest, KickResponse } from "./ProtocolTypes";
import { decodeKickRequest, encodeKickResponse } from "./KickProtoCodec";
import { getNetworkConfig, NetworkRuntimeConfig } from "../config/NetworkConfig";

export interface NetworkAdapterOptions {
  transport?: ISocketTransport;
  config?: Partial<NetworkRuntimeConfig>;
  WebSocketCtor?: WebSocketCtorLike;
}

export class NetworkAdapter {
  private _socket!: KickSocket;
  private _mockServer: MockServer | null = null;
  private _onResponse: ((resp: KickResponse) => void) | null = null;

  constructor(transportOrOptions?: ISocketTransport | NetworkAdapterOptions) {
    const options = normalizeOptions(transportOrOptions);
    const config = getNetworkConfig(options.config);

    if (options.transport) {
      this._socket = new KickSocket(options.transport, config.timeoutMs);
      return;
    }

    if (config.mode === "mock") {
      this._socket = new KickSocket(this._createMockTransport(), config.timeoutMs);
      return;
    }

    const transport = new WebSocketTransport({
      url: config.serverUrl,
      onMessage: (data) => this._socket.onMessage(data),
      WebSocketCtor: options.WebSocketCtor,
    });
    this._socket = new KickSocket(transport, config.timeoutMs);
    transport.connect();
  }

  private _createMockTransport(): ISocketTransport {
    this._mockServer = new MockServer();
    return {
      send: (data: Uint8Array) => {
        // 本地模拟: 直接将请求交给 MockServer 处理
        try {
          const req: KickRequest = decodeKickRequest(data);
          const resp = this._mockServer?.handleKick(req);
          if (!resp) return;
          // 异步回包，模拟网络延迟
          setTimeout(() => {
            this._socket.onMessage(encodeKickResponse(resp));
          }, 50);
        } catch (e) {
          console.error('NetworkAdapter: mock send error', e);
        }
      },
    };
  }

  /** 设置回包回调 */
  onResponse(fn: ((resp: KickResponse) => void) | null): void {
    this._onResponse = fn;
  }

  clearResponseHandler(): void {
    this._onResponse = null;
  }

  destroy(): void {
    this.clearResponseHandler();
    this._socket.close();
    this._mockServer = null;
  }

  /** 发送击打请求 */
  async sendKick(req: Omit<KickRequest, 'seqId'>): Promise<KickResponse> {
    const result = await this._socket.sendKick(req);
    this._onResponse?.(result);
    return result;
  }

  /** 每帧调用：检查超时 */
  update(): void {
    this._socket.checkTimeout();
  }
}

function normalizeOptions(
  transportOrOptions?: ISocketTransport | NetworkAdapterOptions,
): NetworkAdapterOptions {
  if (!transportOrOptions) return {};
  if ("send" in transportOrOptions && typeof transportOrOptions.send === "function") {
    return { transport: transportOrOptions };
  }
  return transportOrOptions as NetworkAdapterOptions;
}
