import {
  PROTOCOL_MSG_IDS,
  type ErrorResponse,
  type GameSnapshot,
  type GameSnapshotResponse,
  type KickRequest,
  type KickResponse,
  type ShrewCycle,
  type ShrewStatePush,
  type ShrewTimelinePush,
  type ShrewTiming,
  type TimeSyncResponse,
} from "./ProtocolTypes";

export type BytesLike = Uint8Array | ArrayBuffer | number[];

export interface ProtocolEnvelope {
  readonly seqId: number;
  readonly msgId: number;
  readonly payload: Uint8Array;
}

export type InboundMessage =
  | { readonly msgId: typeof PROTOCOL_MSG_IDS.KickResp; readonly value: KickResponse }
  | { readonly msgId: typeof PROTOCOL_MSG_IDS.GameSnapshotResp; readonly value: GameSnapshotResponse }
  | { readonly msgId: typeof PROTOCOL_MSG_IDS.TimeSyncResp; readonly value: TimeSyncResponse }
  | { readonly msgId: typeof PROTOCOL_MSG_IDS.ShrewTimelinePush; readonly value: ShrewTimelinePush }
  | { readonly msgId: typeof PROTOCOL_MSG_IDS.ShrewStatePush; readonly value: ShrewStatePush }
  | { readonly msgId: typeof PROTOCOL_MSG_IDS.ErrorResp; readonly value: ErrorResponse };

const WIRE_VARINT = 0;
const WIRE_LENGTH_DELIMITED = 2;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

class ProtoWriter {
  private readonly _bytes: number[] = [];

  uint32(field: number, value: number): void {
    this.tag(field, WIRE_VARINT);
    this.varint(value >>> 0);
  }

  uint64(field: number, value: number): void {
    this.tag(field, WIRE_VARINT);
    this.varint(value);
  }

  int32(field: number, value: number): void {
    this.tag(field, WIRE_VARINT);
    const intValue = value | 0;
    this.varint(intValue < 0 ? 0xffffffff + intValue + 1 : intValue);
  }

  int64(field: number, value: number): void {
    this.tag(field, WIRE_VARINT);
    this.varint(value);
  }

  bool(field: number, value: boolean): void {
    this.tag(field, WIRE_VARINT);
    this.varint(value ? 1 : 0);
  }

  string(field: number, value: string): void {
    this.bytes(field, textEncoder.encode(value));
  }

  message(field: number, value: Uint8Array): void {
    this.bytes(field, value);
  }

  finish(): Uint8Array {
    return new Uint8Array(this._bytes);
  }

  private tag(field: number, wireType: number): void {
    this.varint((field << 3) | wireType);
  }

  private bytes(field: number, value: Uint8Array): void {
    this.tag(field, WIRE_LENGTH_DELIMITED);
    this.varint(value.length);
    for (const byte of value) this._bytes.push(byte);
  }

  private varint(value: number): void {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error(`protobuf only supports non-negative safe integer values, received ${value}`);
    }
    let next = value;
    while (next > 0x7f) {
      this._bytes.push((next % 128) | 0x80);
      next = Math.floor(next / 128);
    }
    this._bytes.push(next);
  }
}

class ProtoReader {
  private readonly _bytes: Uint8Array;
  pos = 0;

  constructor(data: BytesLike) {
    this._bytes = data instanceof Uint8Array
      ? data
      : data instanceof ArrayBuffer
        ? new Uint8Array(data)
        : new Uint8Array(data);
  }

  get done(): boolean {
    return this.pos >= this._bytes.length;
  }

  tag(): { field: number; wireType: number } {
    const tag = this.varint();
    return { field: tag >>> 3, wireType: tag & 0x7 };
  }

  uint32(): number {
    return this.varint() >>> 0;
  }

  uint64(): number {
    return this.varint();
  }

  int32(): number {
    return this.uint32() | 0;
  }

  int64(): number {
    return this.varint();
  }

  bool(): boolean {
    return this.varint() !== 0;
  }

  string(): string {
    return textDecoder.decode(this.bytes());
  }

  bytes(): Uint8Array {
    const length = this.varint();
    const end = this.pos + length;
    if (length < 0 || end > this._bytes.length) {
      throw new Error("protobuf length-delimited field exceeds buffer");
    }
    const value = this._bytes.slice(this.pos, end);
    this.pos = end;
    return value;
  }

  skip(wireType: number): void {
    if (wireType === WIRE_VARINT) {
      this.varint();
      return;
    }
    if (wireType === WIRE_LENGTH_DELIMITED) {
      this.bytes();
      return;
    }
    throw new Error(`unsupported protobuf wire type ${wireType}`);
  }

  private varint(): number {
    let multiplier = 1;
    let result = 0;
    while (this.pos < this._bytes.length) {
      const byte = this._bytes[this.pos++];
      result += (byte & 0x7f) * multiplier;
      if (!Number.isSafeInteger(result)) throw new Error("protobuf varint exceeds Number.MAX_SAFE_INTEGER");
      if ((byte & 0x80) === 0) return result;
      multiplier *= 128;
      if (multiplier > Number.MAX_SAFE_INTEGER) throw new Error("protobuf varint is too long");
    }
    throw new Error("unexpected end of protobuf varint");
  }
}

export function encodeKickRequest(req: KickRequest): Uint8Array {
  return encodeEnvelope(req.seqId, PROTOCOL_MSG_IDS.KickReq, encodeKickRequestPayload(req));
}

export function decodeKickRequest(data: BytesLike): KickRequest {
  const envelope = decodeEnvelope(data);
  expectMsgId(envelope, PROTOCOL_MSG_IDS.KickReq);
  return decodeKickRequestPayload(envelope.payload, envelope.seqId);
}

export function encodeKickResponse(resp: KickResponse): Uint8Array {
  return encodeEnvelope(resp.seqId, PROTOCOL_MSG_IDS.KickResp, encodeKickResponsePayload(resp));
}

export function decodeKickResponse(data: BytesLike): KickResponse {
  const envelope = decodeEnvelope(data);
  expectMsgId(envelope, PROTOCOL_MSG_IDS.KickResp);
  return decodeKickResponsePayload(envelope.payload, envelope.seqId);
}

export function encodeGameSnapshotRequest(seqId: number): Uint8Array {
  return encodeEnvelope(seqId, PROTOCOL_MSG_IDS.GameSnapshotReq, new Uint8Array());
}

export function encodeTimeSyncRequest(seqId: number, clientSendMs: number): Uint8Array {
  const writer = new ProtoWriter();
  writer.int64(1, clientSendMs);
  return encodeEnvelope(seqId, PROTOCOL_MSG_IDS.TimeSyncReq, writer.finish());
}

export function encodeGameSnapshotResponse(response: GameSnapshotResponse): Uint8Array {
  const writer = new ProtoWriter();
  writer.message(1, encodeGameSnapshot(response.snapshot));
  return encodeEnvelope(response.seqId, PROTOCOL_MSG_IDS.GameSnapshotResp, writer.finish());
}

export function encodeShrewStatePush(push: ShrewStatePush): Uint8Array {
  return encodeEnvelope(0, PROTOCOL_MSG_IDS.ShrewStatePush, encodeShrewStatePushPayload(push));
}

export function decodeEnvelope(data: BytesLike): ProtocolEnvelope {
  const reader = new ProtoReader(data);
  const envelope: { seqId: number; msgId: number; payload: Uint8Array } = {
    seqId: 0,
    msgId: 0,
    payload: new Uint8Array(),
  };
  while (!reader.done) {
    const { field, wireType } = reader.tag();
    switch (field) {
      case 1: envelope.seqId = reader.uint32(); break;
      case 2: envelope.msgId = reader.uint32(); break;
      case 3: envelope.payload = reader.bytes(); break;
      default: reader.skip(wireType); break;
    }
  }
  return envelope;
}

export function decodeInboundMessage(data: BytesLike): InboundMessage {
  const envelope = decodeEnvelope(data);
  switch (envelope.msgId) {
    case PROTOCOL_MSG_IDS.KickResp:
      return { msgId: PROTOCOL_MSG_IDS.KickResp, value: decodeKickResponsePayload(envelope.payload, envelope.seqId) };
    case PROTOCOL_MSG_IDS.GameSnapshotResp:
      return { msgId: PROTOCOL_MSG_IDS.GameSnapshotResp, value: decodeGameSnapshotResponse(envelope.payload, envelope.seqId) };
    case PROTOCOL_MSG_IDS.TimeSyncResp:
      return { msgId: PROTOCOL_MSG_IDS.TimeSyncResp, value: decodeTimeSyncResponse(envelope.payload, envelope.seqId) };
    case PROTOCOL_MSG_IDS.ShrewTimelinePush:
      return { msgId: PROTOCOL_MSG_IDS.ShrewTimelinePush, value: decodeShrewTimelinePush(envelope.payload) };
    case PROTOCOL_MSG_IDS.ShrewStatePush:
      return { msgId: PROTOCOL_MSG_IDS.ShrewStatePush, value: decodeShrewStatePush(envelope.payload) };
    case PROTOCOL_MSG_IDS.ErrorResp:
      return { msgId: PROTOCOL_MSG_IDS.ErrorResp, value: decodeErrorResponse(envelope.payload, envelope.seqId) };
    default:
      throw new Error(`unsupported protocol msg_id ${envelope.msgId}`);
  }
}

function encodeEnvelope(seqId: number, msgId: number, payload: Uint8Array): Uint8Array {
  const writer = new ProtoWriter();
  writer.uint32(1, seqId);
  writer.uint32(2, msgId);
  writer.message(3, payload);
  return writer.finish();
}

function expectMsgId(envelope: ProtocolEnvelope, expected: number): void {
  if (envelope.msgId !== expected) {
    throw new Error(`unsupported protocol msg_id ${envelope.msgId}`);
  }
}

function encodeKickRequestPayload(req: KickRequest): Uint8Array {
  const writer = new ProtoWriter();
  if (req.attackEpoch !== undefined) writer.uint64(1, req.attackEpoch);
  writer.int32(2, req.hammerType);
  writer.bool(3, req.bKickShrew !== 0);
  writer.int32(4, req.numOfShrew);
  for (const shrew of req.shrews) writer.message(5, encodeKickShrew(shrew));
  writer.int32(6, req.comboID);
  return writer.finish();
}

function decodeKickRequestPayload(data: BytesLike, seqId: number): KickRequest {
  const reader = new ProtoReader(data);
  const req: KickRequest = { seqId, cmd: "kick", hammerType: 0, bKickShrew: 0, numOfShrew: 0, shrews: [], comboID: 0 };
  while (!reader.done) {
    const { field, wireType } = reader.tag();
    switch (field) {
      case 1: req.attackEpoch = reader.uint64(); break;
      case 2: req.hammerType = reader.int32(); break;
      case 3: req.bKickShrew = reader.bool() ? 1 : 0; break;
      case 4: req.numOfShrew = reader.int32(); break;
      case 5: req.shrews.push(decodeKickShrew(reader.bytes())); break;
      case 6: req.comboID = reader.int32(); break;
      default: reader.skip(wireType); break;
    }
  }
  return req;
}

function encodeKickResponsePayload(resp: KickResponse): Uint8Array {
  const writer = new ProtoWriter();
  writer.int32(1, resp.ret);
  writer.int32(2, resp.money);
  writer.int32(3, resp.angry);
  writer.int32(4, resp.power);
  writer.int32(5, resp.levelScore);
  writer.int32(6, resp.hammerId);
  writer.int32(7, resp.numOfShrew);
  for (const shrew of resp.shrewResp) writer.message(8, encodeShrewReward(shrew.shrewIndex, shrew.reward));
  writer.int32(9, resp.combo);
  writer.int32(10, resp.comboId);
  return writer.finish();
}

function decodeKickResponsePayload(data: BytesLike, seqId: number): KickResponse {
  const reader = new ProtoReader(data);
  const resp: KickResponse = { seqId, cmd: "kickResult", ret: 0, money: 0, angry: 0, power: 0, levelScore: 0, hammerId: 0, numOfShrew: 0, shrewResp: [], combo: 0, comboId: 0 };
  while (!reader.done) {
    const { field, wireType } = reader.tag();
    switch (field) {
      case 1: resp.ret = reader.int32(); break;
      case 2: resp.money = reader.int32(); break;
      case 3: resp.angry = reader.int32(); break;
      case 4: resp.power = reader.int32(); break;
      case 5: resp.levelScore = reader.int32(); break;
      case 6: resp.hammerId = reader.int32(); break;
      case 7: resp.numOfShrew = reader.int32(); break;
      case 8: resp.shrewResp.push(decodeShrewReward(reader.bytes())); break;
      case 9: resp.combo = reader.int32(); break;
      case 10: resp.comboId = reader.int32(); break;
      default: reader.skip(wireType); break;
    }
  }
  return resp;
}

function encodeKickShrew(shrew: KickRequest["shrews"][number]): Uint8Array {
  const writer = new ProtoWriter();
  writer.int32(1, shrew.shrewindex);
  writer.int32(2, shrew.protectType);
  if (shrew.spawnSeq !== undefined) writer.uint64(3, shrew.spawnSeq);
  return writer.finish();
}

function decodeKickShrew(data: Uint8Array): KickRequest["shrews"][number] {
  const reader = new ProtoReader(data);
  const shrew: KickRequest["shrews"][number] = { shrewindex: 0, protectType: 0 };
  while (!reader.done) {
    const { field, wireType } = reader.tag();
    switch (field) {
      case 1: shrew.shrewindex = reader.int32(); break;
      case 2: shrew.protectType = reader.int32(); break;
      case 3: shrew.spawnSeq = reader.uint64(); break;
      default: reader.skip(wireType); break;
    }
  }
  return shrew;
}

function encodeShrewReward(shrewIndex: number, reward: number): Uint8Array {
  const writer = new ProtoWriter();
  writer.int32(1, shrewIndex);
  writer.int32(2, reward);
  return writer.finish();
}

function decodeShrewReward(data: Uint8Array): { shrewIndex: number; reward: number } {
  const reader = new ProtoReader(data);
  const reward = { shrewIndex: 0, reward: 0 };
  while (!reader.done) {
    const { field, wireType } = reader.tag();
    switch (field) {
      case 1: reward.shrewIndex = reader.int32(); break;
      case 2: reward.reward = reader.int32(); break;
      default: reader.skip(wireType); break;
    }
  }
  return reward;
}

function encodeGameSnapshot(snapshot: GameSnapshot): Uint8Array {
  const writer = new ProtoWriter();
  writer.int64(1, snapshot.serverTimeMs);
  writer.uint64(2, snapshot.attackId);
  writer.uint64(3, snapshot.attackEpoch);
  writer.uint64(4, snapshot.timelineRev);
  writer.message(5, encodeShrewTiming(snapshot.defaultTiming));
  for (const cycle of snapshot.activeCycles) writer.message(6, encodeShrewCycle(cycle));
  return writer.finish();
}

function decodeGameSnapshotResponse(data: Uint8Array, seqId: number): GameSnapshotResponse {
  const reader = new ProtoReader(data);
  let snapshot: GameSnapshot | null = null;
  while (!reader.done) {
    const { field, wireType } = reader.tag();
    if (field === 1) snapshot = decodeGameSnapshot(reader.bytes());
    else reader.skip(wireType);
  }
  if (!snapshot) throw new Error("game snapshot response has no snapshot");
  return { seqId, snapshot };
}

function decodeGameSnapshot(data: Uint8Array): GameSnapshot {
  const reader = new ProtoReader(data);
  const snapshot: GameSnapshot = { serverTimeMs: 0, attackId: 0, attackEpoch: 0, timelineRev: 0, defaultTiming: emptyTiming(), activeCycles: [] };
  while (!reader.done) {
    const { field, wireType } = reader.tag();
    switch (field) {
      case 1: snapshot.serverTimeMs = reader.int64(); break;
      case 2: snapshot.attackId = reader.uint64(); break;
      case 3: snapshot.attackEpoch = reader.uint64(); break;
      case 4: snapshot.timelineRev = reader.uint64(); break;
      case 5: snapshot.defaultTiming = decodeShrewTiming(reader.bytes()); break;
      case 6: snapshot.activeCycles.push(decodeShrewCycle(reader.bytes())); break;
      default: reader.skip(wireType); break;
    }
  }
  return snapshot;
}

function encodeShrewTiming(timing: ShrewTiming): Uint8Array {
  const writer = new ProtoWriter();
  writer.int32(1, timing.waitMs);
  writer.int32(2, timing.upMs);
  writer.int32(3, timing.standMs);
  writer.int32(4, timing.downMs);
  writer.int32(5, timing.dizzyMs);
  return writer.finish();
}

function decodeShrewTiming(data: Uint8Array): ShrewTiming {
  const reader = new ProtoReader(data);
  const timing = emptyTiming();
  while (!reader.done) {
    const { field, wireType } = reader.tag();
    switch (field) {
      case 1: timing.waitMs = reader.int32(); break;
      case 2: timing.upMs = reader.int32(); break;
      case 3: timing.standMs = reader.int32(); break;
      case 4: timing.downMs = reader.int32(); break;
      case 5: timing.dizzyMs = reader.int32(); break;
      default: reader.skip(wireType); break;
    }
  }
  return timing;
}

function emptyTiming(): ShrewTiming {
  return { waitMs: 0, upMs: 0, standMs: 0, downMs: 0, dizzyMs: 0 };
}

function encodeShrewCycle(cycle: ShrewCycle): Uint8Array {
  const writer = new ProtoWriter();
  writer.int32(1, cycle.holeIndex);
  writer.uint64(2, cycle.spawnSeq);
  writer.int32(3, cycle.shrewType);
  writer.int32(4, cycle.protectType);
  writer.int32(5, cycle.hp);
  writer.int64(6, cycle.waitStartMs);
  writer.int64(7, cycle.upStartMs);
  writer.int64(8, cycle.standStartMs);
  writer.int64(9, cycle.downStartMs);
  writer.int64(10, cycle.endMs);
  return writer.finish();
}

function decodeShrewCycle(data: Uint8Array): ShrewCycle {
  const reader = new ProtoReader(data);
  const cycle: ShrewCycle = { holeIndex: 0, spawnSeq: 0, shrewType: 0, protectType: 0, hp: 0, waitStartMs: 0, upStartMs: 0, standStartMs: 0, downStartMs: 0, endMs: 0 };
  while (!reader.done) {
    const { field, wireType } = reader.tag();
    switch (field) {
      case 1: cycle.holeIndex = reader.int32(); break;
      case 2: cycle.spawnSeq = reader.uint64(); break;
      case 3: cycle.shrewType = reader.int32(); break;
      case 4: cycle.protectType = reader.int32(); break;
      case 5: cycle.hp = reader.int32(); break;
      case 6: cycle.waitStartMs = reader.int64(); break;
      case 7: cycle.upStartMs = reader.int64(); break;
      case 8: cycle.standStartMs = reader.int64(); break;
      case 9: cycle.downStartMs = reader.int64(); break;
      case 10: cycle.endMs = reader.int64(); break;
      default: reader.skip(wireType); break;
    }
  }
  return cycle;
}

function decodeTimeSyncResponse(data: Uint8Array, seqId: number): TimeSyncResponse {
  const reader = new ProtoReader(data);
  const response: TimeSyncResponse = { seqId, clientSendMs: 0, serverTimeMs: 0 };
  while (!reader.done) {
    const { field, wireType } = reader.tag();
    switch (field) {
      case 1: response.clientSendMs = reader.int64(); break;
      case 2: response.serverTimeMs = reader.int64(); break;
      default: reader.skip(wireType); break;
    }
  }
  return response;
}

function decodeShrewTimelinePush(data: Uint8Array): ShrewTimelinePush {
  const reader = new ProtoReader(data);
  const push: ShrewTimelinePush = { serverTimeMs: 0, attackId: 0, attackEpoch: 0, timelineRev: 0, cycles: [] };
  while (!reader.done) {
    const { field, wireType } = reader.tag();
    switch (field) {
      case 1: push.serverTimeMs = reader.int64(); break;
      case 2: push.attackId = reader.uint64(); break;
      case 3: push.attackEpoch = reader.uint64(); break;
      case 4: push.timelineRev = reader.uint64(); break;
      case 5: push.cycles.push(decodeShrewCycle(reader.bytes())); break;
      default: reader.skip(wireType); break;
    }
  }
  return push;
}

function encodeShrewStatePushPayload(push: ShrewStatePush): Uint8Array {
  const writer = new ProtoWriter();
  writer.int64(1, push.serverTimeMs);
  writer.uint64(2, push.attackId);
  writer.uint64(3, push.attackEpoch);
  writer.uint64(4, push.timelineRev);
  writer.int32(5, push.holeIndex);
  writer.uint64(6, push.spawnSeq);
  writer.int32(7, push.actionState);
  writer.int64(8, push.phaseStartMs);
  writer.int64(9, push.phaseEndMs);
  writer.int32(10, push.hp);
  writer.bool(11, push.clickable);
  return writer.finish();
}

function decodeShrewStatePush(data: Uint8Array): ShrewStatePush {
  const reader = new ProtoReader(data);
  const push: ShrewStatePush = { serverTimeMs: 0, attackId: 0, attackEpoch: 0, timelineRev: 0, holeIndex: 0, spawnSeq: 0, actionState: 0, phaseStartMs: 0, phaseEndMs: 0, hp: 0, clickable: false };
  while (!reader.done) {
    const { field, wireType } = reader.tag();
    switch (field) {
      case 1: push.serverTimeMs = reader.int64(); break;
      case 2: push.attackId = reader.uint64(); break;
      case 3: push.attackEpoch = reader.uint64(); break;
      case 4: push.timelineRev = reader.uint64(); break;
      case 5: push.holeIndex = reader.int32(); break;
      case 6: push.spawnSeq = reader.uint64(); break;
      case 7: push.actionState = reader.int32(); break;
      case 8: push.phaseStartMs = reader.int64(); break;
      case 9: push.phaseEndMs = reader.int64(); break;
      case 10: push.hp = reader.int32(); break;
      case 11: push.clickable = reader.bool(); break;
      default: reader.skip(wireType); break;
    }
  }
  return push;
}

function decodeErrorResponse(data: Uint8Array, seqId: number): ErrorResponse {
  const reader = new ProtoReader(data);
  const response: ErrorResponse = { seqId, code: 0, message: "" };
  while (!reader.done) {
    const { field, wireType } = reader.tag();
    switch (field) {
      case 1: response.code = reader.int32(); break;
      case 2: response.message = reader.string(); break;
      default: reader.skip(wireType); break;
    }
  }
  return response;
}
