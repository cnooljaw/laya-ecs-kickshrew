import { describe, it, expect, beforeEach } from 'vitest';
import { createGameWorld } from '../../framework/ecs/World';
import { createSingletonEntities } from '../helpers/SingletonTestEntities';
import { createHoleEntities, createShrewEntity } from '../helpers/CoreTestEntities';
import { HammerComponent } from "../../game/features/hammer";
import {
  AnimationComponent,
  AnimType,
  HoleComponent,
  MapType,
  ShrewAction,
  ShrewComponent,
  ShrewType,
  resetShrewTimingOverride,
  setShrewTimingOverride,
  shrewStateSystem,
} from "../../game/features/shrew";

const FRAME_DELTA = 1 / 60;

describe('ShrewStateSystem', () => {
  let world: ReturnType<typeof createGameWorld>;

  beforeEach(() => {
    resetShrewTimingOverride();
    world = createGameWorld();
  });

  // ---- 基本状态转换 ----

  it('创建后直接处于 Wait: animTimer 在等待范围内', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);

    expect(ShrewComponent.animTimer[eid]).toBeGreaterThanOrEqual(1);
    expect(ShrewComponent.animTimer[eid]).toBeLessThanOrEqual(8);
    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Wait);
  });

  it('调试加速时序覆盖会缩短等待和出洞动画时长', () => {
    setShrewTimingOverride({
      waitMinSec: 0.05,
      waitMaxSec: 0.05,
      upDurationSec: 0.08,
      downDurationSec: 0.08,
      standSec: 0.2,
      dizzyHoldSec: 0.15,
    });
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);

    expect(ShrewComponent.animTimer[eid]).toBeCloseTo(0.05, 5);

    ShrewComponent.animTimer[eid] = 0;
    shrewStateSystem(world, FRAME_DELTA);

    expect(AnimationComponent.duration[eid]).toBeCloseTo(0.08, 5);
  });

  it('Wait → Up: animTimer 递减到 0 后转 Up，设置动画参数', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    ShrewComponent.actionState[eid] = ShrewAction.Wait;
    ShrewComponent.animTimer[eid] = 0;

    shrewStateSystem(world, FRAME_DELTA);

    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Up);
    expect(AnimationComponent.animType[eid]).toBe(AnimType.Up);
    expect(AnimationComponent.progress[eid]).toBe(0);
    expect(AnimationComponent.duration[eid]).toBeCloseTo(0.31, 2);
  });

  it('Wait 计时中: animTimer > 0 时递减但不转换状态', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    ShrewComponent.actionState[eid] = ShrewAction.Wait;
    ShrewComponent.animTimer[eid] = 2.0;

    shrewStateSystem(world, FRAME_DELTA);

    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Wait);
    expect(ShrewComponent.animTimer[eid]).toBeLessThan(2.0);
  });

  it('Wait 计时使用传入的 deltaSec，而不是固定 60fps', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    ShrewComponent.actionState[eid] = ShrewAction.Wait;
    ShrewComponent.animTimer[eid] = 2.0;

    shrewStateSystem(world, 0.25);

    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Wait);
    expect(ShrewComponent.animTimer[eid]).toBeCloseTo(1.75, 5);
  });

  it('Up → Stand: 动画完成(progress>=1)后转 Stand', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    ShrewComponent.actionState[eid] = ShrewAction.Up;
    AnimationComponent.progress[eid] = 1.0;
    AnimationComponent.duration[eid] = 0.31;

    shrewStateSystem(world, FRAME_DELTA);

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

    shrewStateSystem(world, FRAME_DELTA);

    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Up);
  });

  it('Stand → Down: animTimer 递减到 0 后转 Down', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    ShrewComponent.actionState[eid] = ShrewAction.Stand;
    ShrewComponent.isClickable[eid] = 1;
    ShrewComponent.animTimer[eid] = 0;

    shrewStateSystem(world, FRAME_DELTA);

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

    shrewStateSystem(world, FRAME_DELTA);

    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Stand);
    expect(ShrewComponent.animTimer[eid]).toBeLessThan(1.5);
  });

  it('Down → Wait: 动画完成(progress>=1)后重置并进入下一轮等待', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    ShrewComponent.actionState[eid] = ShrewAction.Down;
    ShrewComponent.hp[eid] = 0;
    AnimationComponent.progress[eid] = 1.0;
    AnimationComponent.duration[eid] = 0.31;

    shrewStateSystem(world, FRAME_DELTA);

    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Wait);
    expect(ShrewComponent.hp[eid]).toBe(1);
    expect(ShrewComponent.isClickable[eid]).toBe(0);
    expect(ShrewComponent.animTimer[eid]).toBeGreaterThanOrEqual(1);
    expect(ShrewComponent.animTimer[eid]).toBeLessThanOrEqual(8);
  });

  it('Down 动画未完成: 保持 Down 状态', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    ShrewComponent.actionState[eid] = ShrewAction.Down;
    AnimationComponent.progress[eid] = 0.3;
    AnimationComponent.duration[eid] = 0.31;

    shrewStateSystem(world, FRAME_DELTA);

    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Down);
  });

  // ---- 特殊状态 ----

  it('Dizzy 计时中: 保持 Dizzy 并递减短暂停留时间', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    ShrewComponent.actionState[eid] = ShrewAction.Dizzy;
    ShrewComponent.animTimer[eid] = 0.3;

    shrewStateSystem(world, FRAME_DELTA);

    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Dizzy);
    expect(ShrewComponent.animTimer[eid]).toBeLessThan(0.3);
  });

  it('Dizzy → Wait: 短暂停留结束后直接重置到下一轮等待', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    ShrewComponent.actionState[eid] = ShrewAction.Dizzy;
    ShrewComponent.hp[eid] = 0;
    ShrewComponent.animTimer[eid] = 0;

    shrewStateSystem(world, FRAME_DELTA);

    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Wait);
    expect(ShrewComponent.hp[eid]).toBe(1);
    expect(ShrewComponent.isClickable[eid]).toBe(0);
    expect(ShrewComponent.animTimer[eid]).toBeGreaterThanOrEqual(1);
    expect(ShrewComponent.animTimer[eid]).toBeLessThanOrEqual(8);
    expect(AnimationComponent.animType[eid]).toBe(AnimType.Idle);
  });

  // ---- 蓝鼠双击 ----

  it('蓝鼠第一击: hp 从 2→1, hasHat 从 1→0, 进入 Dizzy', () => {
    const eid = createShrewEntity(world, ShrewType.Blue, MapType.Meadow);
    // 模拟被击中
    ShrewComponent.hp[eid] = 1; // 被击中后 hp-1
    ShrewComponent.hasHat[eid] = 0; // 帽子碎
    ShrewComponent.actionState[eid] = ShrewAction.Dizzy;
    ShrewComponent.animTimer[eid] = 0;

    shrewStateSystem(world, FRAME_DELTA);

    // Dizzy 结束后进入下一轮，蓝鼠属性恢复为新一轮初始值
    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Wait);
    expect(ShrewComponent.hp[eid]).toBe(2);
    expect(ShrewComponent.hasHat[eid]).toBe(1);
  });

  it('蓝鼠第二击: Dizzy 结束后进入下一轮 Wait', () => {
    const eid = createShrewEntity(world, ShrewType.Blue, MapType.Meadow);
    // 模拟第二击
    ShrewComponent.hp[eid] = 0;
    ShrewComponent.hasHat[eid] = 0;
    ShrewComponent.actionState[eid] = ShrewAction.Dizzy;
    ShrewComponent.animTimer[eid] = 0;

    shrewStateSystem(world, FRAME_DELTA);

    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Wait);
    expect(ShrewComponent.hp[eid]).toBe(2);
    expect(ShrewComponent.hasHat[eid]).toBe(1);
  });

  // ---- 完整循环 ----

  it('完整状态循环 Wait→Up→Stand→Down→Wait', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);

    // 初始就是 Wait
    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Wait);

    // Wait → Up (强制 timer=0)
    ShrewComponent.animTimer[eid] = 0;
    shrewStateSystem(world, FRAME_DELTA);
    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Up);

    // Up → Stand (强制动画完成)
    AnimationComponent.progress[eid] = 1.0;
    AnimationComponent.duration[eid] = 0.31;
    shrewStateSystem(world, FRAME_DELTA);
    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Stand);
    expect(ShrewComponent.isClickable[eid]).toBe(1);

    // Stand → Down (强制 timer=0)
    ShrewComponent.animTimer[eid] = 0;
    shrewStateSystem(world, FRAME_DELTA);
    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Down);
    expect(ShrewComponent.isClickable[eid]).toBe(0);

    // Down → Wait (强制动画完成并重置)
    AnimationComponent.progress[eid] = 1.0;
    AnimationComponent.duration[eid] = 0.31;
    shrewStateSystem(world, FRAME_DELTA);
    expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Wait);
    expect(ShrewComponent.hp[eid]).toBe(1);
  });
});
