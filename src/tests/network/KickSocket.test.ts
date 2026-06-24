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

  it('Envelope.seq_id=0 的回包不匹配 pending 请求', () => {
    socket.sendKick({ cmd: 'kick', hammerType: 1, bKickShrew: 1, numOfShrew: 1, shrews: [], comboID: 0 });

    socket.onMessage(encodeKickResponse({
      seqId: 0, cmd: 'kickResult', ret: 0, money: 150, angry: 40,
      power: 5, levelScore: 300, hammerId: 1, numOfShrew: 1,
      shrewResp: [{ shrewIndex: 7, reward: 150 }], combo: 1, comboId: 9,
    }));

    expect(socket.getPendingCount()).toBe(1);
  });

  it('超时移除并 reject: 请求超时后从 pending 中移除且调用方能收到失败', async () => {
    let currentTime = 0;
    const ts = new KickSocket({ send: () => {} }, 3000, () => currentTime);
    const request = ts.sendKick({ cmd: 'kick', hammerType: 1, bKickShrew: 1, numOfShrew: 0, shrews: [], comboID: 0 });
    expect(ts.getPendingCount()).toBe(1);
    currentTime = 3001;
    ts.checkTimeout();
    expect(ts.getPendingCount()).toBe(0);
    await expect(request).rejects.toBe("Kick request timeout: seqId=1");
  });

  it('超时不影响后续: seqId=1超时后seqId=2仍正常', async () => {
    let currentTime = 0;
    const ts = new KickSocket({ send: () => {} }, 3000, () => currentTime);
    const p1 = ts.sendKick({ cmd: 'kick', hammerType: 1, bKickShrew: 1, numOfShrew: 0, shrews: [], comboID: 0 });
    currentTime = 2000;
    const p2 = ts.sendKick({ cmd: 'kick', hammerType: 1, bKickShrew: 1, numOfShrew: 0, shrews: [], comboID: 0 });
    currentTime = 3001;
    ts.checkTimeout();
    expect(ts.getPendingCount()).toBe(1);
    await expect(p1).rejects.toBe("Kick request timeout: seqId=1");
    ts.onMessage(encodeKickResponse({ seqId: 2, cmd: 'kickResult', ret: 0, money: 200, angry: 50, power: 10, levelScore: 200, hammerId: 1, numOfShrew: 0, shrewResp: [], combo: 0, comboId: 0 }));
    expect((await p2).money).toBe(200);
    expect(ts.getPendingCount()).toBe(0);
  });

  it('超时回调: onTimeout 被调用并传入 seqId', async () => {
    let currentTime = 0;
    const ts = new KickSocket({ send: () => {} }, 3000, () => currentTime);
    const timeoutSeqIds: number[] = [];
    ts.setOnTimeout((seqId) => { timeoutSeqIds.push(seqId); });
    const p1 = ts.sendKick({ cmd: 'kick', hammerType: 1, bKickShrew: 1, numOfShrew: 0, shrews: [], comboID: 0 }).catch((): undefined => undefined);
    const p2 = ts.sendKick({ cmd: 'kick', hammerType: 1, bKickShrew: 1, numOfShrew: 0, shrews: [], comboID: 0 }).catch((): undefined => undefined);
    currentTime = 3001;
    ts.checkTimeout();
    await Promise.all([p1, p2]);
    expect(timeoutSeqIds).toEqual([1, 2]);
  });

  it('close 拒绝全部 pending 请求并关闭 transport', async () => {
    let closed = 0;
    const closingSocket = new KickSocket({
      send: () => {},
      close: () => { closed += 1; },
    });
    const first = closingSocket.sendKick({
      cmd: 'kick', hammerType: 1, bKickShrew: 1, numOfShrew: 0, shrews: [], comboID: 0,
    });
    const second = closingSocket.sendKick({
      cmd: 'kick', hammerType: 1, bKickShrew: 1, numOfShrew: 0, shrews: [], comboID: 0,
    });
    const firstRejected = expect(first).rejects.toBe("Kick socket closed: seqId=1");
    const secondRejected = expect(second).rejects.toBe("Kick socket closed: seqId=2");

    closingSocket.close();

    expect(closingSocket.getPendingCount()).toBe(0);
    expect(closed).toBe(1);
    await Promise.all([firstRejected, secondRejected]);
  });
});
