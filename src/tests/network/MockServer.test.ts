import { describe, it, expect } from 'vitest';
import { MockServer } from '../../network/MockServer';
import type { KickRequest } from '../../network/ProtocolTypes';

describe('MockServer', () => {
  const mockServer = new MockServer();

  it('击中红色地鼠: reward > 0, angry 增加', () => {
    const req: KickRequest = {
      seqId: 1, cmd: 'kick', hammerType: 1, bKickShrew: 1,
      numOfShrew: 1, shrews: [{ shrewindex: 1, protectType: 0 }], comboID: 0,
    };
    const resp = mockServer.handleKick(req);
    expect(resp.seqId).toBe(1);
    expect(resp.ret).toBe(0);
    expect(resp.money).toBeGreaterThan(0);
    expect(resp.angry).toBeGreaterThan(0);
    expect(resp.numOfShrew).toBe(1);
    expect(resp.shrewResp.length).toBe(1);
    expect(resp.shrewResp[0].reward).toBeGreaterThan(0);
  });

  it('击中蓝色地鼠(带帽): reward 翻倍', () => {
    const req: KickRequest = {
      seqId: 2, cmd: 'kick', hammerType: 1, bKickShrew: 1,
      numOfShrew: 1, shrews: [{ shrewindex: 2, protectType: 1 }], comboID: 0,
    };
    const resp = mockServer.handleKick(req);
    expect(resp.seqId).toBe(2);
    expect(resp.shrewResp[0].reward).toBeGreaterThan(0);
  });

  it('未击中: numOfShrew=0, reward=0', () => {
    const req: KickRequest = {
      seqId: 3, cmd: 'kick', hammerType: 1, bKickShrew: 0,
      numOfShrew: 0, shrews: [], comboID: 0,
    };
    const resp = mockServer.handleKick(req);
    expect(resp.seqId).toBe(3);
    expect(resp.numOfShrew).toBe(0);
    expect(resp.money).toBe(0);
  });

  it('锤子类型99(雷神): reward 按所有可见地鼠计算', () => {
    const req: KickRequest = {
      seqId: 4, cmd: 'kick', hammerType: 99, bKickShrew: 1,
      numOfShrew: 3, shrews: [
        { shrewindex: 1, protectType: 0 },
        { shrewindex: 3, protectType: 0 },
        { shrewindex: 5, protectType: 0 },
      ], comboID: 0,
    };
    const resp = mockServer.handleKick(req);
    expect(resp.hammerId).toBe(99);
    expect(resp.shrewResp.length).toBe(3);
  });

});
