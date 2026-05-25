import { describe, it, expect, beforeEach } from 'vitest';
import { createGameWorld, createShrewEntity, createHoleEntities, createSingletonEntities } from '../../ecs/world';
import { ShrewComponent, HoleComponent, HammerComponent } from '../../ecs/components';
import { ShrewType, ShrewAction, MapType, HammerType, HOLE_COUNT } from '../../ecs/types';
import { hitDetectionSystem, HitResult } from '../../ecs/systems/HitDetectionSystem';

describe('HitDetectionSystem', () => {
  let world: ReturnType<typeof createGameWorld>;
  let holes: number[];
  let singletons: ReturnType<typeof createSingletonEntities>;

  beforeEach(() => {
    world = createGameWorld();
    singletons = createSingletonEntities(world);
    holes = createHoleEntities(world, MapType.Meadow);

    // 为每个洞位创建地鼠，并设为可点击
    for (let i = 0; i < HOLE_COUNT; i++) {
      const shrewEid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
      HoleComponent.shrewEid[holes[i]] = shrewEid;
      ShrewComponent.actionState[shrewEid] = ShrewAction.Stand;
      ShrewComponent.isClickable[shrewEid] = 1;
    }
  });

  it('触摸点在地鼠 hitArea 内: 返回击中结果', () => {
    // 模拟触摸洞位 1 (x=0.496, y=0.56) 的坐标
    const result = hitDetectionSystem(world, 0.496, 0.56);

    expect(result.bKickShrew).toBe(1);
    expect(result.hitHoleIndex).toBeGreaterThanOrEqual(0);
    expect(result.hitHoleIndex).toBeLessThan(HOLE_COUNT);
  });

  it('地鼠 isClickable=0 时: 不击中', () => {
    // 让所有地鼠不可点击
    for (let i = 0; i < HOLE_COUNT; i++) {
      const shrewEid = HoleComponent.shrewEid[holes[i]];
      ShrewComponent.isClickable[shrewEid] = 0;
    }

    const result = hitDetectionSystem(world, 0.496, 0.56);

    expect(result.bKickShrew).toBe(0);
  });

  it('锤子 hitTable=0 时(动画中): 不响应触摸', () => {
    HammerComponent.hitTable[singletons.hammer] = 0;

    const result = hitDetectionSystem(world, 0.496, 0.56);

    expect(result.bKickShrew).toBe(0);
  });

  it('锤子 hitTable=1 时: 正常响应触摸', () => {
    HammerComponent.hitTable[singletons.hammer] = 1;

    const result = hitDetectionSystem(world, 0.496, 0.56);

    expect(result.bKickShrew).toBe(1);
  });

  it('击中红鼠: hp-1, actionState=Dizzy', () => {
    // 洞位1: x=0.496, y=0.56
    const shrewEid = HoleComponent.shrewEid[holes[1]];
    ShrewComponent.hp[shrewEid] = 1;
    ShrewComponent.isClickable[shrewEid] = 1;

    hitDetectionSystem(world, 0.496, 0.56);

    expect(ShrewComponent.hp[shrewEid]).toBe(0);
    expect(ShrewComponent.actionState[shrewEid]).toBe(ShrewAction.Dizzy);
    expect(ShrewComponent.isClickable[shrewEid]).toBe(0);
  });

  it('击中蓝鼠第一击: hp-1, hasHat→0, 进入Dizzy', () => {
    const shrewEid = createShrewEntity(world, ShrewType.Blue, MapType.Meadow);
    HoleComponent.shrewEid[holes[1]] = shrewEid;
    ShrewComponent.hp[shrewEid] = 2;
    ShrewComponent.hasHat[shrewEid] = 1;
    ShrewComponent.isClickable[shrewEid] = 1;
    ShrewComponent.actionState[shrewEid] = ShrewAction.Stand;

    hitDetectionSystem(world, 0.496, 0.56);

    expect(ShrewComponent.hp[shrewEid]).toBe(1);
    expect(ShrewComponent.hasHat[shrewEid]).toBe(0);
    expect(ShrewComponent.actionState[shrewEid]).toBe(ShrewAction.Dizzy);
  });

  it('触摸点不在任何洞位范围内: 未击中', () => {
    // 触摸坐标超出所有洞位范围
    const result = hitDetectionSystem(world, 0.01, 0.01);

    expect(result.bKickShrew).toBe(0);
  });

  it('击中后 hitTable 设为 0 (防止连点)', () => {
    HammerComponent.hitTable[singletons.hammer] = 1;

    hitDetectionSystem(world, 0.496, 0.56);

    expect(HammerComponent.hitTable[singletons.hammer]).toBe(0);
  });
});
