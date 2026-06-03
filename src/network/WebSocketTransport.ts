import type { ISocketTransport, SocketMessageData } from "./KickSocket";
import { consoleHitTraceLogger, HitTraceLogger } from "../debug/HitTraceLogger";

type WebSocketEventHandler<T> = ((event: T) => void) | null;

interface BrowserWebSocketLike {
  binaryType: string;
  readyState: number;
  onopen: WebSocketEventHandler<unknown>;
  onmessage: WebSocketEventHandler<{ data: unknown }>;
  onclose: WebSocketEventHandler<unknown>;
  onerror: WebSocketEventHandler<unknown>;
  send(data: Uint8Array): void;
  close(): void;
}

export type WebSocketCtorLike = new (url: string) => BrowserWebSocketLike;

export interface WebSocketTransportOptions {
  url: string;
  onMessage: (data: SocketMessageData) => void;
  WebSocketCtor?: WebSocketCtorLike;
  traceLogger?: HitTraceLogger;
}

const CONNECTING = 0;
const OPEN = 1;

export class WebSocketTransport implements ISocketTransport {
  private readonly _url: string;
  private readonly _onMessage: (data: SocketMessageData) => void;
  private readonly _WebSocketCtor?: WebSocketCtorLike;
  private readonly _traceLogger: HitTraceLogger;
  private _socket: BrowserWebSocketLike | null = null;
  private readonly _sendQueue: Uint8Array[] = [];

  constructor(options: WebSocketTransportOptions) {
    this._url = options.url;
    this._onMessage = options.onMessage;
    this._WebSocketCtor = options.WebSocketCtor;
    this._traceLogger = options.traceLogger ?? consoleHitTraceLogger;
  }

  connect(): void {
    if (this._socket && (this._socket.readyState === CONNECTING || this._socket.readyState === OPEN)) {
      return;
    }

    const WebSocketCtor = this._WebSocketCtor ?? (globalThis as any).WebSocket;
    if (!WebSocketCtor) {
      throw new Error("WebSocketTransport: WebSocket is not available in this runtime");
    }

    const socket = new WebSocketCtor(this._url);
    socket.binaryType = "arraybuffer";
    this._traceLogger.log("transport.connect", { url: this._url });
    socket.onopen = () => {
      this._traceLogger.log("transport.open", {
        url: this._url,
        queuedCount: this._sendQueue.length,
      });
      this._flushQueue(socket);
    };
    socket.onmessage = (event: { data: unknown }) => this._handleMessage(event.data);
    socket.onclose = () => {
      this._traceLogger.log("transport.close", { url: this._url });
      if (this._socket === socket) this._socket = null;
    };
    socket.onerror = (event: unknown) => {
      this._traceLogger.log("transport.error", {
        url: this._url,
        event: String(event),
      });
      console.error("WebSocketTransport: socket error", event);
    };
    this._socket = socket;
  }

  send(data: Uint8Array): void {
    this.connect();
    const socket = this._socket;
    if (socket && socket.readyState === OPEN) {
      this._traceLogger.log("transport.send", {
        url: this._url,
        byteLength: data.byteLength,
        queued: false,
      });
      socket.send(data);
      return;
    }
    this._sendQueue.push(data);
    this._traceLogger.log("transport.send", {
      url: this._url,
      byteLength: data.byteLength,
      queued: true,
      queuedCount: this._sendQueue.length,
    });
  }

  close(): void {
    this._sendQueue.length = 0;
    const socket = this._socket;
    this._socket = null;
    socket?.close();
  }

  private _flushQueue(socket: BrowserWebSocketLike): void {
    if (this._socket !== socket || socket.readyState !== OPEN) return;
    while (this._sendQueue.length > 0) {
      const data = this._sendQueue.shift();
      if (data) {
        this._traceLogger.log("transport.flushSend", {
          url: this._url,
          byteLength: data.byteLength,
        });
        socket.send(data);
      }
    }
  }

  private _handleMessage(data: unknown): void {
    if (data instanceof Uint8Array || data instanceof ArrayBuffer || Array.isArray(data)) {
      this._traceLogger.log("transport.message", {
        url: this._url,
        byteLength: data instanceof ArrayBuffer ? data.byteLength : data.length,
      });
      this._onMessage(data);
      return;
    }
    console.error("WebSocketTransport: unsupported message data", data);
  }
}
