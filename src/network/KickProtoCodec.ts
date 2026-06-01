import type { KickRequest, KickResponse } from "./ProtocolTypes";

type BytesLike = Uint8Array | ArrayBuffer | number[];

const WIRE_VARINT = 0;
const WIRE_LENGTH_DELIMITED = 2;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

class ProtoWriter {
  private readonly _bytes: number[] = [];

  uint32(field: number, value: number): void {
    this.tag(field, WIRE_VARINT);
    this.varint32(value >>> 0, 0);
  }

  int32(field: number, value: number): void {
    this.tag(field, WIRE_VARINT);
    const intValue = value | 0;
    this.varint32(intValue >>> 0, intValue < 0 ? 0xffffffff : 0);
  }

  bool(field: number, value: boolean): void {
    this.tag(field, WIRE_VARINT);
    this.varint32(value ? 1 : 0, 0);
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
    this.varint32((field << 3) | wireType, 0);
  }

  private bytes(field: number, value: Uint8Array): void {
    this.tag(field, WIRE_LENGTH_DELIMITED);
    this.varint32(value.length, 0);
    for (const byte of value) this._bytes.push(byte);
  }

  private varint32(low: number, high: number): void {
    let nextLow = low >>> 0;
    let nextHigh = high >>> 0;
    while (nextHigh !== 0 || nextLow > 0x7f) {
      this._bytes.push((nextLow & 0x7f) | 0x80);
      nextLow = ((nextLow >>> 7) | ((nextHigh & 0x7f) << 25)) >>> 0;
      nextHigh >>>= 7;
    }
    this._bytes.push(nextLow);
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
    const tag = this.varintLow32();
    return {
      field: tag >>> 3,
      wireType: tag & 0x7,
    };
  }

  uint32(): number {
    return this.varintLow32() >>> 0;
  }

  int32(): number {
    return this.varintLow32() | 0;
  }

  bool(): boolean {
    return this.varintLow32() !== 0;
  }

  string(): string {
    return textDecoder.decode(this.bytes());
  }

  bytes(): Uint8Array {
    const length = this.varintLow32();
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
      this.varintLow32();
      return;
    }
    if (wireType === WIRE_LENGTH_DELIMITED) {
      this.bytes();
      return;
    }
    throw new Error(`unsupported protobuf wire type ${wireType}`);
  }

  private varintLow32(): number {
    let shift = 0;
    let result = 0;
    while (this.pos < this._bytes.length) {
      const byte = this._bytes[this.pos++];
      if (shift < 32) {
        result = (result | ((byte & 0x7f) << shift)) >>> 0;
      }
      if ((byte & 0x80) === 0) return result;
      shift += 7;
      if (shift > 70) throw new Error("protobuf varint is too long");
    }
    throw new Error("unexpected end of protobuf varint");
  }
}

export function encodeKickRequest(req: KickRequest): Uint8Array {
  const writer = new ProtoWriter();
  writer.uint32(1, req.seqId);
  writer.string(2, req.cmd);
  writer.int32(3, req.hammerType);
  writer.bool(4, req.bKickShrew !== 0);
  writer.int32(5, req.numOfShrew);
  for (const shrew of req.shrews) {
    writer.message(6, encodeKickShrew(shrew.shrewindex, shrew.protectType));
  }
  writer.int32(7, req.comboID);
  return writer.finish();
}

export function decodeKickRequest(data: BytesLike): KickRequest {
  const reader = new ProtoReader(data);
  const req: KickRequest = {
    seqId: 0,
    cmd: "kick",
    hammerType: 0,
    bKickShrew: 0,
    numOfShrew: 0,
    shrews: [],
    comboID: 0,
  };

  while (!reader.done) {
    const { field, wireType } = reader.tag();
    switch (field) {
      case 1:
        req.seqId = reader.uint32();
        break;
      case 2:
        req.cmd = reader.string() as KickRequest["cmd"];
        break;
      case 3:
        req.hammerType = reader.int32();
        break;
      case 4:
        req.bKickShrew = reader.bool() ? 1 : 0;
        break;
      case 5:
        req.numOfShrew = reader.int32();
        break;
      case 6:
        req.shrews.push(decodeKickShrew(reader.bytes()));
        break;
      case 7:
        req.comboID = reader.int32();
        break;
      default:
        reader.skip(wireType);
        break;
    }
  }
  return req;
}

export function encodeKickResponse(resp: KickResponse): Uint8Array {
  const writer = new ProtoWriter();
  writer.uint32(1, resp.seqId);
  writer.string(2, resp.cmd);
  writer.int32(3, resp.ret);
  writer.int32(4, resp.money);
  writer.int32(5, resp.angry);
  writer.int32(6, resp.power);
  writer.int32(7, resp.levelScore);
  writer.int32(8, resp.hammerId);
  writer.int32(9, resp.numOfShrew);
  for (const shrew of resp.shrewResp) {
    writer.message(10, encodeShrewReward(shrew.shrewIndex, shrew.reward));
  }
  writer.int32(11, resp.combo);
  writer.int32(12, resp.comboId);
  return writer.finish();
}

export function decodeKickResponse(data: BytesLike): KickResponse {
  const reader = new ProtoReader(data);
  const resp: KickResponse = {
    seqId: 0,
    cmd: "kickResult",
    ret: 0,
    money: 0,
    angry: 0,
    power: 0,
    levelScore: 0,
    hammerId: 0,
    numOfShrew: 0,
    shrewResp: [],
    combo: 0,
    comboId: 0,
  };

  while (!reader.done) {
    const { field, wireType } = reader.tag();
    switch (field) {
      case 1:
        resp.seqId = reader.uint32();
        break;
      case 2:
        resp.cmd = reader.string() as KickResponse["cmd"];
        break;
      case 3:
        resp.ret = reader.int32();
        break;
      case 4:
        resp.money = reader.int32();
        break;
      case 5:
        resp.angry = reader.int32();
        break;
      case 6:
        resp.power = reader.int32();
        break;
      case 7:
        resp.levelScore = reader.int32();
        break;
      case 8:
        resp.hammerId = reader.int32();
        break;
      case 9:
        resp.numOfShrew = reader.int32();
        break;
      case 10:
        resp.shrewResp.push(decodeShrewReward(reader.bytes()));
        break;
      case 11:
        resp.combo = reader.int32();
        break;
      case 12:
        resp.comboId = reader.int32();
        break;
      default:
        reader.skip(wireType);
        break;
    }
  }
  return resp;
}

function encodeKickShrew(shrewIndex: number, protectType: number): Uint8Array {
  const writer = new ProtoWriter();
  writer.int32(1, shrewIndex);
  writer.int32(2, protectType);
  return writer.finish();
}

function decodeKickShrew(data: Uint8Array): { shrewindex: number; protectType: number } {
  const reader = new ProtoReader(data);
  const shrew = { shrewindex: 0, protectType: 0 };
  while (!reader.done) {
    const { field, wireType } = reader.tag();
    switch (field) {
      case 1:
        shrew.shrewindex = reader.int32();
        break;
      case 2:
        shrew.protectType = reader.int32();
        break;
      default:
        reader.skip(wireType);
        break;
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
      case 1:
        reward.shrewIndex = reader.int32();
        break;
      case 2:
        reward.reward = reader.int32();
        break;
      default:
        reader.skip(wireType);
        break;
    }
  }
  return reward;
}
