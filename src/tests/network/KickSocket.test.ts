import { describe, it, expect, beforeEach } from 'vitest';
import { KickSocket } from '../../network/KickSocket';
import type { KickResponse } from '../../network/ProtocolTypes';
import { decodeKickRequest, encodeKickResponse } from '../../network/KickProtoCodec';

describe('KickSocket', () => {
  let socket: KickSocket;
  let sentMessages: Uint8Array[];

  beforeEach(() => {
    sentMessages = [];
    socket = new KickSocket({
      send: (data: Uint8Array) => { sentMessages.push(data); },
    });
  });

  it('seqId 递增: 连续发送3个请求，seqId分别为1,2,3', () => {
    socket.sendKick({ cmd: 'kick', hammerType: 1, bKickShrew: 1, numOfShrew: 1, shrews: [], comboID: 0 });
    socket.sendKick({ cmd: 'kick', hammerType: 1, bKickShrew: 1, numOfShrew: 1, shrews: [], comboID: 0 });
    socket.sendKick({ cmd: 'kick', hammerType: 1, bKickShrew: 1, numOfShrew: 1, shrews: [], comboID: 0 });

    expect(decodeKickRequest(sentMessages[0]).seqId).toBe(1);
    expect(decodeKickRequest(sentMessages[1]).seqId).toBe(2);
    expect(decodeKickRequest(sentMessages[2]).seqId).toBe(3);
  });

  it('单请求匹配: 发送seqId=1请求，收到seqId=1回包', async () => {
    const p = socket.sendKick({ cmd: 'kick', hammerType: 1, bKickShrew: 1, numOfShrew: 0, shrews: [], comboID: 0 });
    socket.onMessage(encodeKickResponse({
      seqId: 1, cmd: 'kickResult', ret: 0, money: 100, angry: 50,
      power: 10, levelScore: 200, hammerId: 1, numOfShrew: 0,
      shrewResp: [], combo: 0, comboId: 0,
    }));
    const result = await p;
    expect(result.money).toBe(100);
    expect(socket.getPendingCount()).toBe(0);
  });

  it('乱序回包: 先回seqId=2再seqId=1', async () => {
    const p1 = socket.sendKick({ cmd: 'kick', hammerType: 1, bKickShrew: 1, numOfShrew: 1, shrews: [], comboID: 0 });
    const p2 = socket.sendKick({ cmd: 'kick', hammerType: 1, bKickShrew: 1, numOfShrew: 1, shrews: [], comboID: 0 });
    socket.onMessage(encodeKickResponse({ seqId: 2, cmd: 'kickResult', ret: 0, money: 200, angry: 60, power: 20, levelScore: 400, hammerId: 1, numOfShrew: 1, shrewResp: [], combo: 0, comboId: 0 }));
    expect((await p2).money).toBe(200);
    socket.onMessage(encodeKickResponse({ seqId: 1, cmd: 'kickResult', ret: 0, money: 100, angry: 50, power: 10, levelScore: 200, hammerId: 1, numOfShrew: 1, shrewResp: [], combo: 0, comboId: 0 }));
    expect((await p1).money).toBe(100);
    expect(socket.getPendingCount()).toBe(0);
  });

  it('并发匹配: 5个请求乱序回包全部正确', async () => {
    const promises: Promise<KickResponse>[] = [];
    for (let i = 0; i < 5; i++) {
      promises.push(socket.sendKick({ cmd: 'kick', hammerType: 1, bKickShrew: 1, numOfShrew: 1, shrews: [], comboID: 0 }));
    }
    for (const seqId of [3, 1, 5, 2, 4]) {
      socket.onMessage(encodeKickResponse({ seqId, cmd: 'kickResult', ret: 0, money: seqId * 100, angry: 50, power: 10, levelScore: 200, hammerId: 1, numOfShrew: 1, shrewResp: [], combo: 0, comboId: 0 }));
    }
    const results = await Promise.all(promises);
    expect(results.map(r => r.money)).toEqual([100, 200, 300, 400, 500]);
    expect(socket.getPendingCount()).toBe(0);
  });

  it('未知seqId丢弃', () => {
    socket.onMessage(encodeKickResponse({ seqId: 999, cmd: 'kickResult', ret: 0, money: 0, angry: 0, power: 0, levelScore: 0, hammerId: 1, numOfShrew: 0, shrewResp: [], combo: 0, comboId: 0 }));
    expect(socket.getPendingCount()).toBe(0);
  });

  it('服务端回包 seqId=0 时按最早 pending 请求兼容匹配', async () => {
    const p = socket.sendKick({ cmd: 'kick', hammerType: 1, bKickShrew: 1, numOfShrew: 1, shrews: [], comboID: 0 });

    socket.onMessage(encodeKickResponse({
      seqId: 0, cmd: 'kickResult', ret: 0, money: 150, angry: 40,
      power: 5, levelScore: 300, hammerId: 1, numOfShrew: 1,
      shrewResp: [{ shrewIndex: 7, reward: 150 }], combo: 1, comboId: 9,
    }));

    const result = await p;
    expect(result.seqId).toBe(1);
    expect(result.money).toBe(150);
    expect(socket.getPendingCount()).toBe(0);
  });

  it('超时移除: 请求超时后从pending中移除', () => {
    let currentTime = 0;
    const ts = new KickSocket({ send: () => {} }, 3000, () => currentTime);
    ts.sendKick({ cmd: 'kick', hammerType: 1, bKickShrew: 1, numOfShrew: 0, shrews: [], comboID: 0 });
    expect(ts.getPendingCount()).toBe(1);
    currentTime = 3001;
    ts.checkTimeout();
    expect(ts.getPendingCount()).toBe(0);
  });

  it('超时不影响后续: seqId=1超时后seqId=2仍正常', async () => {
    let currentTime = 0;
    const ts = new KickSocket({ send: () => {} }, 3000, () => currentTime);
    ts.sendKick({ cmd: 'kick', hammerType: 1, bKickShrew: 1, numOfShrew: 0, shrews: [], comboID: 0 });
    currentTime = 2000;
    const p2 = ts.sendKick({ cmd: 'kick', hammerType: 1, bKickShrew: 1, numOfShrew: 0, shrews: [], comboID: 0 });
    currentTime = 3001;
    ts.checkTimeout();
    expect(ts.getPendingCount()).toBe(1);
    ts.onMessage(encodeKickResponse({ seqId: 2, cmd: 'kickResult', ret: 0, money: 200, angry: 50, power: 10, levelScore: 200, hammerId: 1, numOfShrew: 0, shrewResp: [], combo: 0, comboId: 0 }));
    expect((await p2).money).toBe(200);
    expect(ts.getPendingCount()).toBe(0);
  });

  it('超时回调: onTimeout 被调用并传入 seqId', () => {
    let currentTime = 0;
    const ts = new KickSocket({ send: () => {} }, 3000, () => currentTime);
    const timeoutSeqIds: number[] = [];
    ts.setOnTimeout((seqId) => { timeoutSeqIds.push(seqId); });
    ts.sendKick({ cmd: 'kick', hammerType: 1, bKickShrew: 1, numOfShrew: 0, shrews: [], comboID: 0 });
    ts.sendKick({ cmd: 'kick', hammerType: 1, bKickShrew: 1, numOfShrew: 0, shrews: [], comboID: 0 });
    currentTime = 3001;
    ts.checkTimeout();
    expect(timeoutSeqIds).toEqual([1, 2]);
  });
});
