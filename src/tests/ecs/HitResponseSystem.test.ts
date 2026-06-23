import { describe, it, expect, beforeEach } from 'vitest';
import { createGameWorld, createSingletonEntities } from '../../ecs/world';
import { PlayerComponent, HammerComponent, ComboComponent } from '../../ecs/components';
import { HammerType } from '../../ecs/types';
import { hitResponseSystem, KickResponse } from '../../ecs/gameplay/hud/HitResponseSystem';

describe('HitResponseSystem', () => {
  let world: ReturnType<typeof createGameWorld>;
  let singletons: ReturnType<typeof createSingletonEntities>;

  beforeEach(() => {
    world = createGameWorld();
    singletons = createSingletonEntities(world);
  });

  const makeResponse = (overrides: Partial<KickResponse> = {}): KickResponse => ({
    seqId: 1,
    cmd: 'kickResult',
    ret: 0,
    money: 100,
    angry: 50,
    power: 10,
    levelScore: 200,
    hammerId: HammerType.Wood,
    numOfShrew: 1,
    shrewResp: [{ shrewIndex: 0, reward: 50 }],
    combo: 0,
    comboId: 0,
    ...overrides,
  });

  it('ret=0: 更新 money/angry/power', () => {
    const resp = makeResponse({ money: 100, angry: 50, power: 10 });

    hitResponseSystem(world, resp);

    expect(PlayerComponent.money[singletons.player]).toBe(100);
    expect(PlayerComponent.angry[singletons.player]).toBe(50);
    expect(PlayerComponent.power[singletons.player]).toBe(10);
  });

  it('ret=0: 更新 levelScore', () => {
    const resp = makeResponse({ levelScore: 200 });

    hitResponseSystem(world, resp);

    expect(PlayerComponent.level[singletons.player]).toBe(200);
  });

  it('angry>=1000: 触发 isThunderActive=1', () => {
    PlayerComponent.angry[singletons.player] = 990;
    const resp = makeResponse({ angry: 1010 });

    hitResponseSystem(world, resp);

    expect(HammerComponent.isThunderActive[singletons.hammer]).toBe(1);
  });

  it('angry<1000: 不触发雷神锤', () => {
    PlayerComponent.angry[singletons.player] = 500;
    const resp = makeResponse({ angry: 800 });

    hitResponseSystem(world, resp);

    expect(HammerComponent.isThunderActive[singletons.hammer]).toBe(0);
  });

  it('hammerId=99(雷神): 验证锤子类型', () => {
    const resp = makeResponse({ hammerId: HammerType.Thunder });

    hitResponseSystem(world, resp);

    expect(HammerComponent.selectedType[singletons.hammer]).toBe(HammerType.Thunder);
  });

  it('ret=-1: 不更新玩家数据', () => {
    PlayerComponent.money[singletons.player] = 50;
    const resp = makeResponse({ ret: -1, money: 999 });

    hitResponseSystem(world, resp);

    expect(PlayerComponent.money[singletons.player]).toBe(50);
  });

  it('combo>0: 更新 ComboComponent', () => {
    const resp = makeResponse({ combo: 3, comboId: 7 });

    hitResponseSystem(world, resp);

    expect(ComboComponent.comboCount[singletons.combo]).toBe(3);
    expect(ComboComponent.comboID[singletons.combo]).toBe(7);
  });

  it('shrewResp 包含奖励数据', () => {
    const resp = makeResponse({
      numOfShrew: 2,
      shrewResp: [
        { shrewIndex: 0, reward: 50 },
        { shrewIndex: 4, reward: 100 },
      ],
    });

    const result = hitResponseSystem(world, resp);

    expect(result.length).toBe(2);
    expect(result[0].reward).toBe(50);
    expect(result[1].reward).toBe(100);
  });

  it('记录服务器回包应用后的分数增量', () => {
    const events: Array<{ event: string; payload: Record<string, unknown> }> = [];
    const resp = makeResponse({ money: 120, power: 3, levelScore: 450 });

    (hitResponseSystem as any)(world, resp, {
      log: (event: string, payload: Record<string, unknown>) => events.push({ event, payload }),
    });

    expect(events).toEqual([
      {
        event: "score.applied",
        payload: expect.objectContaining({
          seqId: 1,
          ret: 0,
          moneyBefore: 0,
          moneyDelta: 120,
          moneyAfter: 120,
          powerBefore: 0,
          powerDelta: 3,
          powerAfter: 3,
          levelBefore: 0,
          levelAfter: 450,
        }),
      },
    ]);
  });
});
