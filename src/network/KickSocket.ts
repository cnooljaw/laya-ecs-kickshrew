/**
 * KickSocket — 基于 seqId 的请求-回包匹配网络封装
 *
 * 核心机制:
 * 1. 每个请求携带递增 seqId
 * 2. 发送后存入 pendingRequests Map
 * 3. 收到回包后按 seqId 弹出对应 pending
 * 4. 超时(3秒)未回包自动移除
 * 5. 不阻塞输入——玩家可连续敲击
 *
 * 传输层抽象为 ISocketTransport，便于测试时注入 mock
 */
import type { KickRequest, KickResponse } from "./ProtocolTypes";

/** 传输层接口，Laya.Socket 或测试 mock 均可实现 */
export interface ISocketTransport {
  send(data: string): void;
  // onMessage 回调由构造函数或 setter 设置
}

interface PendingEntry {
  req: KickRequest;
  timestamp: number;
  resolve: (resp: KickResponse) => void;
  reject: (reason: string) => void;
}

const DEFAULT_TIMEOUT_MS = 3000;

export class KickSocket {
  private _seqId: number = 0;
  private _pendingRequests: Map<number, PendingEntry> = new Map();
  private _transport: ISocketTransport;
  private _timeoutMs: number;
  private _nowFn: () => number;
  private _onTimeout: ((seqId: number) => void) | null = null;

  constructor(transport: ISocketTransport, timeoutMs: number = DEFAULT_TIMEOUT_MS, nowFn?: () => number) {
    this._transport = transport;
    this._timeoutMs = timeoutMs;
    this._nowFn = nowFn || (() => Date.now());
  }

  /** 设置超时回调，超时后不再 reject Promise */
  setOnTimeout(fn: (seqId: number) => void): void {
    this._onTimeout = fn;
  }

  /**
   * 发送击打请求，返回 Promise
   * @param req 不含 seqId 的请求体
   * @returns Promise<KickResponse>
   */
  sendKick(req: Omit<KickRequest, 'seqId'>): Promise<KickResponse> {
    const seqId = ++this._seqId;
    const fullReq: KickRequest = { ...req, seqId };

    return new Promise<KickResponse>((resolve, reject) => {
      this._pendingRequests.set(seqId, {
        req: fullReq,
        timestamp: this._nowFn(),
        resolve,
        reject,
      });
      this._transport.send(JSON.stringify(fullReq));
    });
  }

  /**
   * 收到消息，按 seqId 匹配 pending 请求
   * @param data JSON 字符串
   */
  onMessage(data: string): void {
    try {
      const resp: KickResponse = JSON.parse(data);
      const pending = this._pendingRequests.get(resp.seqId);
      if (pending) {
        this._pendingRequests.delete(resp.seqId);
        pending.resolve(resp);
      }
      // 无匹配 seqId 则丢弃（可能是超时后的迟到回包）
    } catch (e) {
      console.error('KickSocket: failed to parse message', e);
    }
  }

  /**
   * 检查超时请求，移除超时的 pending
   * 应每帧调用
   */
  checkTimeout(): void {
    const now = this._nowFn();
    for (const [seqId, pending] of this._pendingRequests) {
      if (now - pending.timestamp > this._timeoutMs) {
        this._pendingRequests.delete(seqId);
        // 通过回调通知超时，而不是 reject（避免 unhandled rejection）
        this._onTimeout?.(seqId);
      }
    }
  }

  /** 获取当前等待回包的请求数量 */
  getPendingCount(): number {
    return this._pendingRequests.size;
  }
}
