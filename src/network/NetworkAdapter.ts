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
import type { KickRequest, KickResponse } from "./ProtocolTypes";

export class NetworkAdapter {
  private _socket: KickSocket;
  private _mockServer: MockServer;
  private _onResponse: ((resp: KickResponse) => void) | null = null;

  constructor(transport?: ISocketTransport) {
    this._mockServer = new MockServer();
    this._socket = new KickSocket(transport || {
      send: (data: string) => {
        // 本地模拟: 直接将请求交给 MockServer 处理
        try {
          const req: KickRequest = JSON.parse(data);
          const resp = this._mockServer.handleKick(req);
          // 异步回包，模拟网络延迟
          setTimeout(() => {
            this._socket.onMessage(JSON.stringify(resp));
          }, 50);
        } catch (e) {
          console.error('NetworkAdapter: mock send error', e);
        }
      },
    });
  }

  /** 设置回包回调 */
  onResponse(fn: (resp: KickResponse) => void): void {
    this._onResponse = fn;
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
