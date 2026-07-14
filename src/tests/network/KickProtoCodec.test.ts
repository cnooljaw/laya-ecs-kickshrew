import { describe, expect, it } from 'vitest';
import {
  decodeInboundMessage,
  decodeKickRequest,
  decodeKickResponse,
  encodeGameSnapshotResponse,
  encodeKickRequest,
  encodeKickResponse,
  encodeMapStatePush,
  encodeShrewStatePush,
} from '../../network/KickProtoCodec';
import { PROTOCOL_MSG_IDS, RoomPhase } from '../../network/ProtocolTypes';
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

function readEnvelope(data: Uint8Array): { seqId: number; msgId: number; payload: Uint8Array } {
  const reader = new TestProtoReader(data);
  const envelope: { seqId: number; msgId: number; payload: Uint8Array } = {
    seqId: 0,
    msgId: 0,
    payload: new Uint8Array(),
  };
  while (!reader.done) {
    const { field, wireType } = reader.tag();
    if (field === 1) envelope.seqId = reader.uint32();
    else if (field === 2) envelope.msgId = reader.uint32();
    else if (field === 3) envelope.payload = reader.bytesField();
    else reader.skip(wireType);
  }
  return envelope;
}

function readKickRequestPayload(data: Uint8Array): { fieldNumbers: number[]; hammerType: number; kickShrew: boolean; numOfShrew: number } {
  const reader = new TestProtoReader(data);
  const payload = { fieldNumbers: [] as number[], hammerType: 0, kickShrew: false, numOfShrew: 0 };
  while (!reader.done) {
    const { field, wireType } = reader.tag();
    payload.fieldNumbers.push(field);
    if (field === 2) payload.hammerType = reader.uint32() | 0;
    else if (field === 3) payload.kickShrew = reader.bool();
    else if (field === 4) payload.numOfShrew = reader.uint32() | 0;
    else reader.skip(wireType);
  }
  return payload;
}

function readKickResponsePayload(data: Uint8Array): { fieldNumbers: number[]; ret: number; money: number } {
  const reader = new TestProtoReader(data);
  const payload = { fieldNumbers: [] as number[], ret: 0, money: 0 };
  while (!reader.done) {
    const { field, wireType } = reader.tag();
    payload.fieldNumbers.push(field);
    if (field === 1) payload.ret = reader.uint32() | 0;
    else if (field === 2) payload.money = reader.uint32() | 0;
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

  it('按 Envelope.seq_id/msg_id 封包请求，业务 payload 不再写 seq_id/cmd', () => {
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
    expect(envelope.msgId).toBe(PROTOCOL_MSG_IDS.KickReq);
    expect(payload.hammerType).toBe(1);
    expect(payload.kickShrew).toBe(true);
    expect(payload.numOfShrew).toBe(1);
    expect(payload.fieldNumbers).toEqual([2, 3, 4, 5, 6]);
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

  it('按 Envelope.seq_id/msg_id 封包回包，业务 payload 不再写 seq_id/cmd', () => {
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
    expect(envelope.msgId).toBe(PROTOCOL_MSG_IDS.KickResp);
    expect(payload.ret).toBe(0);
    expect(payload.money).toBe(10);
    expect(payload.fieldNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
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

  it('拒绝超出 buffer 的 length-delimited payload', () => {
    expect(() => decodeKickResponse(new Uint8Array([
      0x08, 0x01,
      0x10, 0xd2, 0x0f,
      0x1a, 0x05, 0x08,
    ]))).toThrow("protobuf length-delimited field exceeds buffer");
  });

  it('拒绝未知 Envelope.msg_id', () => {
    expect(() => decodeKickResponse(new Uint8Array([
      0x08, 0x01,
      0x10, 0x63,
      0x1a, 0x00,
    ]))).toThrow("unsupported protocol msg_id 99");
  });

  it('保留服务端快照和状态推送中的 64 位毫秒时间', () => {
    const serverTimeMs = 1_752_000_000_123;
    const snapshot = decodeInboundMessage(encodeGameSnapshotResponse({
      seqId: 9,
      snapshot: {
        serverTimeMs,
        attackId: 1,
        attackEpoch: 2,
        timelineRev: 3,
        defaultTiming: { waitMs: 1000, upMs: 300, standMs: 2000, downMs: 300, dizzyMs: 500 },
        roomPhase: RoomPhase.Running,
        playerCount: 3,
        roomSize: 3,
        startAtMs: serverTimeMs,
        mapTimeline: {
          currentMap: 2,
          mapRevision: 5,
          mapStartedMs: serverTimeMs,
          nextSwitchMs: serverTimeMs + 16_000,
          nextMap: 3,
          cycleMs: 16_000,
        },
        activeCycles: [{
          holeIndex: 1,
          spawnSeq: 4,
          shrewType: 2,
          protectType: 0,
          hp: 2,
          waitStartMs: serverTimeMs,
          upStartMs: serverTimeMs + 1000,
          standStartMs: serverTimeMs + 1300,
          downStartMs: serverTimeMs + 3300,
          endMs: serverTimeMs + 3600,
        }],
      },
    }));

    expect(snapshot.msgId).toBe(PROTOCOL_MSG_IDS.GameSnapshotResp);
    if (snapshot.msgId !== PROTOCOL_MSG_IDS.GameSnapshotResp) throw new Error("expected snapshot");
    expect(snapshot.value.snapshot.activeCycles[0].standStartMs).toBe(serverTimeMs + 1300);
    expect(snapshot.value.snapshot.mapTimeline.nextSwitchMs).toBe(serverTimeMs + 16_000);

    const state = decodeInboundMessage(encodeShrewStatePush({
      serverTimeMs,
      attackId: 1,
      attackEpoch: 2,
      timelineRev: 3,
      holeIndex: 1,
      spawnSeq: 4,
      actionState: 5,
      phaseStartMs: serverTimeMs,
      phaseEndMs: serverTimeMs + 500,
      hp: 0,
      clickable: false,
    }));
    expect(state.msgId).toBe(PROTOCOL_MSG_IDS.ShrewStatePush);
    if (state.msgId !== PROTOCOL_MSG_IDS.ShrewStatePush) throw new Error("expected state push");
    expect(state.value.phaseEndMs).toBe(serverTimeMs + 500);

    const map = decodeInboundMessage(encodeMapStatePush({
      serverTimeMs,
      attackId: 1,
      attackEpoch: 2,
      timeline: {
        currentMap: 3,
        mapRevision: 6,
        mapStartedMs: serverTimeMs + 16_000,
        nextSwitchMs: serverTimeMs + 32_000,
        nextMap: 4,
        cycleMs: 16_000,
      },
    }));
    expect(map.msgId).toBe(PROTOCOL_MSG_IDS.MapStatePush);
    if (map.msgId !== PROTOCOL_MSG_IDS.MapStatePush) throw new Error("expected map push");
    expect(map.value.timeline.currentMap).toBe(3);
    expect(map.value.timeline.mapRevision).toBe(6);
  });
});
