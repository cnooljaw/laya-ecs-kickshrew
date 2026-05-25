import { describe, it, expect, beforeEach } from 'vitest';
import { createGameWorld, createShrewEntity, createHoleEntities, createSingletonEntities } from '../../ecs/world';
import { ShrewComponent, AnimationComponent, HammerComponent, HoleComponent } from '../../ecs/components';
import { ShrewType, ShrewAction, MapType, AnimType } from '../../ecs/types';
import { shrewStateSystem } from '../../ecs/systems/ShrewStateSystem';

describe('ShrewStateSystem', () => {
  let world: ReturnType<typeof createGameWorld>;

  beforeEach(() => {
    world = createGameWorld();
  });

  // ---- 基本状态转换 ----

  it('None → Wait: 初始状态为 None，执行后转为 Wait，animTimer 在 1~9 范围', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    ShrewComponent.actionState[eid] = ShrewAction.None;

    shrewStateSystem(world);

    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Wait);
    expect(ShrewComponent.animTimer[eid]).toBeGreaterThanOrEqual(1);
    expect(ShrewComponent.animTimer[eid]).toBeLessThanOrEqual(9);
  });

  it('Wait → Up: animTimer 递减到 0 后转 Up，设置动画参数', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    ShrewComponent.actionState[eid] = ShrewAction.Wait;
    ShrewComponent.animTimer[eid] = 0;

    shrewStateSystem(world);

    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Up);
    expect(AnimationComponent.animType[eid]).toBe(AnimType.Up);
    expect(AnimationComponent.progress[eid]).toBe(0);
    expect(AnimationComponent.duration[eid]).toBeCloseTo(0.31, 2);
  });

  it('Wait 计时中: animTimer > 0 时递减但不转换状态', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    ShrewComponent.actionState[eid] = ShrewAction.Wait;
    ShrewComponent.animTimer[eid] = 2.0;

    shrewStateSystem(world);

    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Wait);
    expect(ShrewComponent.animTimer[eid]).toBeLessThan(2.0);
  });

  it('Up → Stand: 动画完成(progress>=1)后转 Stand', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    ShrewComponent.actionState[eid] = ShrewAction.Up;
    AnimationComponent.progress[eid] = 1.0;
    AnimationComponent.duration[eid] = 0.31;

    shrewStateSystem(world);

    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Stand);
    expect(ShrewComponent.isClickable[eid]).toBe(1);
    expect(ShrewComponent.animTimer[eid]).toBeCloseTo(2.0, 1);
    expect(AnimationComponent.animType[eid]).toBe(AnimType.Stand);
  });

  it('Up 动画未完成: 保持 Up 状态', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    ShrewComponent.actionState[eid] = ShrewAction.Up;
    AnimationComponent.progress[eid] = 0.5;
    AnimationComponent.duration[eid] = 0.31;

    shrewStateSystem(world);

    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Up);
  });

  it('Stand → Down: animTimer 递减到 0 后转 Down', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    ShrewComponent.actionState[eid] = ShrewAction.Stand;
    ShrewComponent.isClickable[eid] = 1;
    ShrewComponent.animTimer[eid] = 0;

    shrewStateSystem(world);

    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Down);
    expect(ShrewComponent.isClickable[eid]).toBe(0);
    expect(AnimationComponent.animType[eid]).toBe(AnimType.Down);
    expect(AnimationComponent.progress[eid]).toBe(0);
    expect(AnimationComponent.duration[eid]).toBeCloseTo(0.31, 2);
  });

  it('Stand 计时中: animTimer > 0 时递减但不转换', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    ShrewComponent.actionState[eid] = ShrewAction.Stand;
    ShrewComponent.animTimer[eid] = 1.5;

    shrewStateSystem(world);

    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Stand);
    expect(ShrewComponent.animTimer[eid]).toBeLessThan(1.5);
  });

  it('Down → Refresh: 动画完成(progress>=1)后转 Refresh', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    ShrewComponent.actionState[eid] = ShrewAction.Down;
    AnimationComponent.progress[eid] = 1.0;
    AnimationComponent.duration[eid] = 0.31;

    shrewStateSystem(world);

    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Refresh);
  });

  it('Down 动画未完成: 保持 Down 状态', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    ShrewComponent.actionState[eid] = ShrewAction.Down;
    AnimationComponent.progress[eid] = 0.3;
    AnimationComponent.duration[eid] = 0.31;

    shrewStateSystem(world);

    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Down);
  });

  it('Refresh → None: 重置地鼠属性回到初始', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    ShrewComponent.actionState[eid] = ShrewAction.Refresh;
    ShrewComponent.hp[eid] = 0;
    ShrewComponent.hasHat[eid] = 0;

    shrewStateSystem(world);

    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.None);
    // hp 应重置: 红鼠=1, 蓝鼠=2
    expect(ShrewComponent.hp[eid]).toBe(1);
    expect(ShrewComponent.hasHat[eid]).toBe(0);
    expect(ShrewComponent.isClickable[eid]).toBe(0);
    expect(AnimationComponent.animType[eid]).toBe(AnimType.Idle);
  });

  // ---- 特殊状态 ----

  it('Dizzy → Delay: 外部设置 Dizzy 状态，系统推进到 Delay', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    ShrewComponent.actionState[eid] = ShrewAction.Dizzy;
    ShrewComponent.animTimer[eid] = 0;

    shrewStateSystem(world);

    // Dizzy 动画完成后转到 Delay
    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Delay);
  });

  it('Delay → Down: Delay 计时到 0 后转入 Down', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    ShrewComponent.actionState[eid] = ShrewAction.Delay;
    ShrewComponent.animTimer[eid] = 0;

    shrewStateSystem(world);

    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Down);
    expect(AnimationComponent.animType[eid]).toBe(AnimType.Down);
  });

  // ---- 蓝鼠双击 ----

  it('蓝鼠第一击: hp 从 2→1, hasHat 从 1→0, 进入 Dizzy', () => {
    const eid = createShrewEntity(world, ShrewType.Blue, MapType.Meadow);
    // 模拟被击中
    ShrewComponent.hp[eid] = 1; // 被击中后 hp-1
    ShrewComponent.hasHat[eid] = 0; // 帽子碎
    ShrewComponent.actionState[eid] = ShrewAction.Dizzy;
    ShrewComponent.animTimer[eid] = 0;

    shrewStateSystem(world);

    // 蓝鼠 hp=1 仍有生命，Dizzy→Delay→Down→Refresh
    expect(ShrewComponent.hp[eid]).toBe(1);
    expect(ShrewComponent.hasHat[eid]).toBe(0);
    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Delay);
  });

  it('蓝鼠第二击: hp 从 1→0, 进入 Dizzy', () => {
    const eid = createShrewEntity(world, ShrewType.Blue, MapType.Meadow);
    // 模拟第二击
    ShrewComponent.hp[eid] = 0;
    ShrewComponent.hasHat[eid] = 0;
    ShrewComponent.actionState[eid] = ShrewAction.Dizzy;
    ShrewComponent.animTimer[eid] = 0;

    shrewStateSystem(world);

    expect(ShrewComponent.hp[eid]).toBe(0);
  });

  // ---- 完整循环 ----

  it('完整状态循环 None→Wait→Up→Stand→Down→Refresh→None', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);

    // None → Wait
    shrewStateSystem(world);
    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Wait);

    // Wait → Up (强制 timer=0)
    ShrewComponent.animTimer[eid] = 0;
    shrewStateSystem(world);
    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Up);

    // Up → Stand (强制动画完成)
    AnimationComponent.progress[eid] = 1.0;
    AnimationComponent.duration[eid] = 0.31;
    shrewStateSystem(world);
    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Stand);
    expect(ShrewComponent.isClickable[eid]).toBe(1);

    // Stand → Down (强制 timer=0)
    ShrewComponent.animTimer[eid] = 0;
    shrewStateSystem(world);
    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Down);
    expect(ShrewComponent.isClickable[eid]).toBe(0);

    // Down → Refresh (强制动画完成)
    AnimationComponent.progress[eid] = 1.0;
    AnimationComponent.duration[eid] = 0.31;
    shrewStateSystem(world);
    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Refresh);

    // Refresh → None
    shrewStateSystem(world);
    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.None);
    expect(ShrewComponent.hp[eid]).toBe(1);
  });
});
