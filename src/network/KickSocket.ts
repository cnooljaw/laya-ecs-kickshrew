import type {
  GameSnapshotResponse,
  KickRequest,
  KickResponse,
  TimeSyncResponse,
} from "./ProtocolTypes";
import {
  decodeInboundMessage,
  encodeGameSnapshotRequest,
  encodeKickRequest,
  encodeTimeSyncRequest,
  type InboundMessage,
} from "./KickProtoCodec";
import { consoleHitTraceLogger, HitTraceLogger } from "../debug/HitTraceLogger";

export type SocketMessageData = Uint8Array | ArrayBuffer | number[];

export interface ISocketTransport {
  send(data: Uint8Array): void;
  close?(): void;
}

interface PendingEntry<T> {
  readonly kind: string;
  readonly request: unknown;
  readonly timestamp: number;
  readonly resolve: (value: T) => void;
  readonly reject: (reason: string) => void;
}

const DEFAULT_TIMEOUT_MS = 3000;

export class KickSocket {
  private _seqId = 0;
  private readonly _pendingRequests = new Map<number, PendingEntry<unknown>>();
  private _onTimeout: ((seqId: number) => void) | null = null;
  private _onPush: ((message: InboundMessage) => void) | null = null;

  constructor(
    private readonly _transport: ISocketTransport,
    private readonly _timeoutMs: number = DEFAULT_TIMEOUT_MS,
    private readonly _nowFn: () => number = () => Date.now(),
    private readonly _traceLogger: HitTraceLogger = consoleHitTraceLogger,
  ) {}

  setOnTimeout(fn: (seqId: number) => void): void {
    this._onTimeout = fn;
  }

  setOnPush(fn: ((message: InboundMessage) => void) | null): void {
    this._onPush = fn;
  }

  sendKick(req: Omit<KickRequest, "seqId">): Promise<KickResponse> {
    return this._send("kick", req, (seqId) => encodeKickRequest({ ...req, seqId }));
  }

  requestGameSnapshot(): Promise<GameSnapshotResponse> {
    return this._send("gameSnapshot", undefined, (seqId) => encodeGameSnapshotRequest(seqId));
  }

  requestTimeSync(clientSendMs: number): Promise<TimeSyncResponse> {
    return this._send("timeSync", { clientSendMs }, (seqId) => encodeTimeSyncRequest(seqId, clientSendMs));
  }

  onMessage(data: SocketMessageData): void {
    try {
      const message = decodeInboundMessage(data);
      if (message.msgId === 3001 || message.msgId === 3002 || message.msgId === 3003) {
        this._traceLogger.log("socket.push", { msgId: message.msgId, value: message.value });
        this._onPush?.(message);
        return;
      }

      const seqId = message.value.seqId;

      const pending = this._pendingRequests.get(seqId);
      if (!pending) {
        this._traceLogger.log("socket.response", { seqId, matched: false, response: message.value });
        return;
      }
      this._pendingRequests.delete(seqId);

      if (message.msgId === 9001) {
        pending.reject(`Server error: ${message.value.code} ${message.value.message}`);
        return;
      }

      this._traceLogger.log("socket.response", {
        seqId,
        kind: pending.kind,
        matched: true,
        pendingCount: this._pendingRequests.size,
        response: message.value,
      });
      pending.resolve(message.value);
    } catch (error) {
      this._traceLogger.log("socket.decodeFailed", { error: String(error) });
      console.error("KickSocket: failed to decode protobuf message", error);
    }
  }

  checkTimeout(): void {
    const now = this._nowFn();
    for (const [seqId, pending] of this._pendingRequests) {
      if (now - pending.timestamp <= this._timeoutMs) continue;
      this._pendingRequests.delete(seqId);
      this._traceLogger.log("socket.timeout", {
        seqId,
        kind: pending.kind,
        elapsedMs: now - pending.timestamp,
        request: pending.request,
        pendingCount: this._pendingRequests.size,
      });
      this._onTimeout?.(seqId);
      const requestName = pending.kind === "kick" ? "Kick" : pending.kind;
      pending.reject(`${requestName} request timeout: seqId=${seqId}`);
    }
  }

  getPendingCount(): number {
    return this._pendingRequests.size;
  }

  close(): void {
    for (const [seqId, pending] of this._pendingRequests) {
      pending.reject(`Kick socket closed: seqId=${seqId}`);
    }
    this._pendingRequests.clear();
    this._transport.close?.();
  }

  private _send<T>(kind: string, request: unknown, encode: (seqId: number) => Uint8Array): Promise<T> {
    const seqId = ++this._seqId;
    const encoded = encode(seqId);
    return new Promise<T>((resolve, reject) => {
      this._pendingRequests.set(seqId, {
        kind,
        request,
        timestamp: this._nowFn(),
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      this._traceLogger.log("socket.send", {
        seqId,
        kind,
        byteLength: encoded.byteLength,
        request,
        pendingCount: this._pendingRequests.size,
      });
      this._transport.send(encoded);
    });
  }
}
