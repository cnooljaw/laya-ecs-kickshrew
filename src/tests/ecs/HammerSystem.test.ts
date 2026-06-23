import { describe, it, expect, beforeEach } from 'vitest';
import { createGameWorld, createSingletonEntities } from '../../ecs/world';
import { HammerComponent, PlayerComponent } from '../../ecs/components';
import { HammerType } from '../../ecs/types';
import { hammerSystem } from '../../ecs/gameplay/hammer/HammerSystem';

describe('HammerSystem', () => {
  let world: ReturnType<typeof createGameWorld>;
  let singletons: ReturnType<typeof createSingletonEntities>;

  beforeEach(() => {
    world = createGameWorld();
    singletons = createSingletonEntities(world);
  });

  it('默认锤子 selectedType=Wood(1)', () => {
    expect(HammerComponent.selectedType[singletons.hammer]).toBe(HammerType.Wood);
  });

  it('切换锤子: selectedType 更新', () => {
    hammerSystem(world, HammerType.Gold);

    expect(HammerComponent.selectedType[singletons.hammer]).toBe(HammerType.Gold);
  });

  it('angry 从 990 变 1010: 触发雷神锤 isThunderActive=1, selectedType=Thunder', () => {
    PlayerComponent.angry[singletons.player] = 1010;

    hammerSystem(world);

    expect(HammerComponent.isThunderActive[singletons.hammer]).toBe(1);
    expect(HammerComponent.selectedType[singletons.hammer]).toBe(HammerType.Thunder);
  });

  it('angry < 1000: 不触发雷神锤', () => {
    PlayerComponent.angry[singletons.player] = 800;

    hammerSystem(world);

    expect(HammerComponent.isThunderActive[singletons.hammer]).toBe(0);
  });

  it('雷神锤动画完成: isThunderActive=0, selectedType 恢复 previousType', () => {
    // 先触发雷神锤
    PlayerComponent.angry[singletons.player] = 1010;
    hammerSystem(world);
    expect(HammerComponent.isThunderActive[singletons.hammer]).toBe(1);

    // 雷神锤动画完成
    hammerSystem(world, HammerType.Gold, true);

    expect(HammerComponent.isThunderActive[singletons.hammer]).toBe(0);
    expect(HammerComponent.selectedType[singletons.hammer]).toBe(HammerType.Gold);
  });

  it('雷神锤状态时 hitTable=0, 阻止普通敲击', () => {
    PlayerComponent.angry[singletons.player] = 1010;
    hammerSystem(world);

    // 雷神锤触发时 hitTable 应该为 0（由雷神锤动画控制）
    expect(HammerComponent.isThunderActive[singletons.hammer]).toBe(1);
  });

  it('hitTable 恢复: 锤子动画结束后 hitTable=1', () => {
    HammerComponent.hitTable[singletons.hammer] = 0;
    HammerComponent.hitCooldownSec[singletons.hammer] = 0.24;

    hammerSystem(world, undefined, false, true);

    expect(HammerComponent.hitTable[singletons.hammer]).toBe(1);
    expect(HammerComponent.hitCooldownSec[singletons.hammer]).toBe(0);
  });

  it('普通击打冷却结束后自动恢复 hitTable=1', () => {
    HammerComponent.hitTable[singletons.hammer] = 0;
    HammerComponent.hitCooldownSec[singletons.hammer] = 0.24;

    hammerSystem(world, undefined, false, false, 0.12);
    expect(HammerComponent.hitTable[singletons.hammer]).toBe(0);
    expect(HammerComponent.hitCooldownSec[singletons.hammer]).toBeCloseTo(0.12, 3);

    hammerSystem(world, undefined, false, false, 0.12);
    expect(HammerComponent.hitTable[singletons.hammer]).toBe(1);
    expect(HammerComponent.hitCooldownSec[singletons.hammer]).toBe(0);
  });
});
