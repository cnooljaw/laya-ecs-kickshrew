import { describe, expect, it } from 'vitest';
import { decodeKickRequest, decodeKickResponse, encodeKickRequest, encodeKickResponse } from '../../network/KickProtoCodec';
import type { KickRequest, KickResponse } from '../../network/ProtocolTypes';

type BytesLike = Uint8Array | ArrayBuffer | number[];

class TestProtoReader {
  private readonly bytes: Uint8Array;
  pos = 0;

  constructor(data: BytesLike) {
    this.bytes = data instanceof Uint8Array
      ? data
      : data instanceof ArrayBuffer
        ? new Uint8Array(data)
        : new Uint8Array(data);
  }

  get done(): boolean {
    return this.pos >= this.bytes.length;
  }

  tag(): { field: number; wireType: number } {
    const tag = this.uint32();
    return { field: tag >>> 3, wireType: tag & 0x7 };
  }

  uint32(): number {
    let shift = 0;
    let result = 0;
    while (this.pos < this.bytes.length) {
      const byte = this.bytes[this.pos++];
      result = (result | ((byte & 0x7f) << shift)) >>> 0;
      if ((byte & 0x80) === 0) return result;
      shift += 7;
    }
    throw new Error("unexpected end of varint");
  }

  bool(): boolean {
    return this.uint32() !== 0;
  }

  string(): string {
    return new TextDecoder().decode(this.bytesField());
  }

  bytesField(): Uint8Array {
    const length = this.uint32();
    const end = this.pos + length;
    const value = this.bytes.slice(this.pos, end);
    this.pos = end;
    return value;
  }

  skip(wireType: number): void {
    if (wireType === 0) {
      this.uint32();
      return;
    }
    if (wireType === 2) {
      this.bytesField();
      return;
    }
    throw new Error(`unsupported wire type ${wireType}`);
  }
}

function readEnvelope(data: Uint8Array): { seqId: number; cmd: string; payload: Uint8Array } {
  const reader = new TestProtoReader(data);
  const envelope: { seqId: number; cmd: string; payload: Uint8Array } = {
    seqId: 0,
    cmd: "",
    payload: new Uint8Array(),
  };
  while (!reader.done) {
    const { field, wireType } = reader.tag();
    if (field === 1) envelope.seqId = reader.uint32();
    else if (field === 2) envelope.cmd = reader.string();
    else if (field === 3) envelope.payload = reader.bytesField();
    else reader.skip(wireType);
  }
  return envelope;
}

function readKickRequestPayload(data: Uint8Array): { fieldNumbers: number[]; cmd: string; hammerType: number; kickShrew: boolean } {
  const reader = new TestProtoReader(data);
  const payload = { fieldNumbers: [] as number[], cmd: "", hammerType: 0, kickShrew: false };
  while (!reader.done) {
    const { field, wireType } = reader.tag();
    payload.fieldNumbers.push(field);
    if (field === 1) payload.cmd = reader.string();
    else if (field === 2) payload.hammerType = reader.uint32() | 0;
    else if (field === 3) payload.kickShrew = reader.bool();
    else reader.skip(wireType);
  }
  return payload;
}

function readKickResponsePayload(data: Uint8Array): { fieldNumbers: number[]; cmd: string; ret: number; money: number } {
  const reader = new TestProtoReader(data);
  const payload = { fieldNumbers: [] as number[], cmd: "", ret: 0, money: 0 };
  while (!reader.done) {
    const { field, wireType } = reader.tag();
    payload.fieldNumbers.push(field);
    if (field === 1) payload.cmd = reader.string();
    else if (field === 2) payload.ret = reader.uint32() | 0;
    else if (field === 3) payload.money = reader.uint32() | 0;
    else reader.skip(wireType);
  }
  return payload;
}

describe('KickProtoCodec', () => {
  it('按 kick.proto 编解码 KickRequest', () => {
    const input: KickRequest = {
      seqId: 3,
      cmd: 'kick',
      hammerType: 1,
      bKickShrew: 1,
      numOfShrew: 1,
      comboID: 11,
      shrews: [{ shrewindex: 4, protectType: 0 }],
    };

    const output = decodeKickRequest(encodeKickRequest(input));

    expect(output).toEqual(input);
  });

  it('按 Envelope.seq_id 封包请求，业务 payload 不再写 seq_id', () => {
    const input: KickRequest = {
      seqId: 3,
      cmd: 'kick',
      hammerType: 1,
      bKickShrew: 1,
      numOfShrew: 1,
      comboID: 11,
      shrews: [{ shrewindex: 4, protectType: 0 }],
    };

    const envelope = readEnvelope(encodeKickRequest(input));
    const payload = readKickRequestPayload(envelope.payload);

    expect(envelope.seqId).toBe(3);
    expect(envelope.cmd).toBe("kick");
    expect(payload.cmd).toBe("kick");
    expect(payload.hammerType).toBe(1);
    expect(payload.kickShrew).toBe(true);
    expect(payload.fieldNumbers).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('按 kick.proto 编解码 KickResponse', () => {
    const input: KickResponse = {
      seqId: 3,
      cmd: 'kickResult',
      ret: 0,
      money: 10,
      angry: 20,
      power: 1,
      levelScore: 10,
      hammerId: 1,
      numOfShrew: 1,
      combo: 1,
      comboId: 11,
      shrewResp: [{ shrewIndex: 4, reward: 10 }],
    };

    const output = decodeKickResponse(encodeKickResponse(input));

    expect(output).toEqual(input);
  });

  it('按 Envelope.seq_id 封包回包，业务 payload 不再写 seq_id', () => {
    const input: KickResponse = {
      seqId: 3,
      cmd: 'kickResult',
      ret: 0,
      money: 10,
      angry: 20,
      power: 1,
      levelScore: 10,
      hammerId: 1,
      numOfShrew: 1,
      combo: 1,
      comboId: 11,
      shrewResp: [{ shrewIndex: 4, reward: 10 }],
    };

    const envelope = readEnvelope(encodeKickResponse(input));
    const payload = readKickResponsePayload(envelope.payload);

    expect(envelope.seqId).toBe(3);
    expect(envelope.cmd).toBe("kickResult");
    expect(payload.cmd).toBe("kickResult");
    expect(payload.ret).toBe(0);
    expect(payload.money).toBe(10);
    expect(payload.fieldNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('把 proto bool kick_shrew 映射回旧业务字段 bKickShrew', () => {
    const miss = decodeKickRequest(encodeKickRequest({
      seqId: 1,
      cmd: 'kick',
      hammerType: 1,
      bKickShrew: 0,
      numOfShrew: 0,
      shrews: [],
      comboID: 0,
    }));

    expect(miss.bKickShrew).toBe(0);
  });
});
