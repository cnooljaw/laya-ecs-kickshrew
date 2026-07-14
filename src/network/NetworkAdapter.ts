import { KickSocket, type ISocketTransport } from "./KickSocket";
import { MockServer } from "./MockServer";
import { WebSocketTransport, type WebSocketCtorLike } from "./WebSocketTransport";
import type {
  GameSnapshot,
  KickRequest,
  KickResponse,
  ShrewStatePush,
  ShrewTimelinePush,
  TimeSyncResponse,
} from "./ProtocolTypes";
import { decodeKickRequest, encodeKickResponse } from "./KickProtoCodec";
import { getNetworkConfig, type NetworkRuntimeConfig } from "../config/NetworkConfig";
import { consoleHitTraceLogger, type HitTraceLogger } from "../debug/HitTraceLogger";

const SNAPSHOT_REFRESH_MS = 500;
const TIME_SYNC_REFRESH_MS = 5_000;

export interface NetworkAdapterOptions {
  transport?: ISocketTransport;
  config?: Partial<NetworkRuntimeConfig>;
  WebSocketCtor?: WebSocketCtorLike;
  traceLogger?: HitTraceLogger;
}

export class NetworkAdapter {
  private _socket!: KickSocket;
  private _mockServer: MockServer | null = null;
  private _attackEpoch = 0;
  private _hasAuthoritativeSnapshot = false;
  private _lastSnapshotRequestMs = 0;
  private _lastTimeSyncRequestMs = 0;
  private _onResponse: ((resp: KickResponse) => void) | null = null;
  private _onSnapshot: ((snapshot: GameSnapshot) => void) | null = null;
  private _onTimeline: ((push: ShrewTimelinePush) => void) | null = null;
  private _onShrewState: ((push: ShrewStatePush) => void) | null = null;
  private _onTimeSync: ((response: TimeSyncResponse) => void) | null = null;

  constructor(transportOrOptions?: ISocketTransport | NetworkAdapterOptions) {
    const options = normalizeOptions(transportOrOptions);
    const config = getNetworkConfig(options.config);
    const traceLogger = options.traceLogger ?? consoleHitTraceLogger;
    traceLogger.log("network.config", { mode: config.mode, serverUrl: config.serverUrl, timeoutMs: config.timeoutMs });

    if (options.transport) {
      this._socket = new KickSocket(options.transport, config.timeoutMs, undefined, traceLogger);
    } else if (config.mode === "mock") {
      this._socket = new KickSocket(this._createMockTransport(), config.timeoutMs, undefined, traceLogger);
    } else {
      const transport = new WebSocketTransport({
        url: config.serverUrl,
        onMessage: (data) => this._socket.onMessage(data),
        WebSocketCtor: options.WebSocketCtor,
        traceLogger,
      });
      this._socket = new KickSocket(transport, config.timeoutMs, undefined, traceLogger);
      transport.connect();
    }

    this._socket.setOnPush((message) => {
      if (message.msgId === 3001) {
        this._attackEpoch = message.value.attackEpoch;
        this._onTimeline?.(message.value);
      } else if (message.msgId === 3002) {
        this._attackEpoch = message.value.attackEpoch;
        this._onShrewState?.(message.value);
      }
    });
  }

  onResponse(fn: ((resp: KickResponse) => void) | null): void {
    this._onResponse = fn;
  }

  onGameSnapshot(fn: ((snapshot: GameSnapshot) => void) | null): void {
    this._onSnapshot = fn;
  }

  onShrewTimeline(fn: ((push: ShrewTimelinePush) => void) | null): void {
    this._onTimeline = fn;
  }

  onShrewState(fn: ((push: ShrewStatePush) => void) | null): void {
    this._onShrewState = fn;
  }

  onTimeSync(fn: ((response: TimeSyncResponse) => void) | null): void {
    this._onTimeSync = fn;
  }

  async requestGameSnapshot(): Promise<GameSnapshot | null> {
    if (this._mockServer) return null;
    this._lastSnapshotRequestMs = Date.now();
    const response = await this._socket.requestGameSnapshot();
    this._attackEpoch = response.snapshot.attackEpoch;
    this._hasAuthoritativeSnapshot = true;
    this._onSnapshot?.(response.snapshot);
    return response.snapshot;
  }

  async requestTimeSync(): Promise<TimeSyncResponse | null> {
    if (this._mockServer) return null;
    const clientSendMs = Date.now();
    this._lastTimeSyncRequestMs = clientSendMs;
    const response = await this._socket.requestTimeSync(clientSendMs);
    this._onTimeSync?.(response);
    return response;
  }

  destroy(): void {
    this._onResponse = null;
    this._onSnapshot = null;
    this._onTimeline = null;
    this._onShrewState = null;
    this._onTimeSync = null;
    this._socket.close();
    this._mockServer = null;
  }

  async sendKick(req: Omit<KickRequest, "seqId" | "attackEpoch"> & { attackEpoch?: number }): Promise<KickResponse> {
    const result = await this._socket.sendKick({
      ...req,
      attackEpoch: req.attackEpoch ?? this._attackEpoch,
    });
    this._onResponse?.(result);
    return result;
  }

  update(): void {
    this._socket.checkTimeout();
    if (this._mockServer || !this._hasAuthoritativeSnapshot) return;
    const now = Date.now();
    if (now - this._lastSnapshotRequestMs >= SNAPSHOT_REFRESH_MS) {
      void this.requestGameSnapshot().catch((): void => undefined);
    }
    if (now - this._lastTimeSyncRequestMs >= TIME_SYNC_REFRESH_MS) {
      void this.requestTimeSync().catch((): void => undefined);
    }
  }

  private _createMockTransport(): ISocketTransport {
    this._mockServer = new MockServer();
    return {
      send: (data: Uint8Array) => {
        try {
          const req = decodeKickRequest(data);
          const resp = this._mockServer?.handleKick(req);
          if (!resp) return;
          setTimeout(() => this._socket.onMessage(encodeKickResponse(resp)), 50);
        } catch (error) {
          console.error("NetworkAdapter: mock send error", error);
        }
      },
    };
  }
}

function normalizeOptions(transportOrOptions?: ISocketTransport | NetworkAdapterOptions): NetworkAdapterOptions {
  if (!transportOrOptions) return {};
  if ("send" in transportOrOptions && typeof transportOrOptions.send === "function") {
    return { transport: transportOrOptions };
  }
  return transportOrOptions as NetworkAdapterOptions;
}
