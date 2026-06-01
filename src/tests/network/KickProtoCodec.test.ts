import { describe, expect, it } from 'vitest';
import { decodeKickRequest, decodeKickResponse, encodeKickRequest, encodeKickResponse } from '../../network/KickProtoCodec';
import type { KickRequest, KickResponse } from '../../network/ProtocolTypes';

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
