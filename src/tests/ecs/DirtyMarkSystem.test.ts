import { describe, it, expect, beforeEach } from 'vitest';
import { addComponent, addEntity } from 'bitecs';
import { createGameWorld, createShrewEntity, createSingletonEntities, createHoleEntities, createPerfHeroEntities } from '../../ecs/world';
import {
  ShrewComponent,
  DirtyComponent,
  AnimationComponent,
  HoleComponent,
  HammerComponent,
  SceneComponent,
  PlayerComponent,
  HitComponent,
  ComboComponent,
  PerfHeroComponent,
} from '../../ecs/components';
import { ShrewType, ShrewAction, MapType } from '../../ecs/types';
import { dirtyMarkSystem, getDirtySnapshotForTest } from '../../ecs/systems/DirtyMarkSystem';
import { ShrewDirtyAspect } from '../../ecs/dirty/aspects/ShrewDirtyAspect';
import { SHREW_COMPONENT_RULES, SHREW_ANIMATION_RULES } from '../../binding/rules/ShrewViewRules';
import {
  BIT_HOLE_POS,
  BIT_HOLE_SHREW,
  BIT_SHREW_ACTION,
  BIT_ANIM_PROGRESS,
  BIT_HAMMER_TYPE,
  BIT_HAMMER_THUNDER,
  BIT_HAMMER_HITTABLE,
  BIT_SCENE_MAP,
  BIT_SCENE_TIMER,
  BIT_SCENE_TRANSITION,
  BIT_PLAYER_MONEY,
  BIT_PLAYER_ANGRY,
  BIT_PLAYER_POWER,
  BIT_PLAYER_LEVEL,
  BIT_HIT_INDEX,
  BIT_HIT_REWARD,
  BIT_HIT_WASHIT,
  BIT_COMBO_COUNT,
  BIT_COMBO_ID,
  BIT_COMBO_TARGETS,
  BIT_PERF_HERO_POS,
  BIT_PERF_HERO_SPAWN,
} from '../../binding/DirtyFlags';

describe('DirtyMarkSystem', () => {
  let world: ReturnType<typeof createGameWorld>;

  beforeEach(() => {
    world = createGameWorld();
  });

  it('ShrewDirtyAspect 由表格式 ShrewViewRules 派生 dirty marks', () => {
    expect(ShrewDirtyAspect.requires).toEqual([
      'ShrewComponent',
      'AnimationComponent',
      'DirtyComponent',
    ]);

    const shrewChannel = ShrewDirtyAspect.channels.find(channel => channel.dirtyTarget === 'shrewDirty');
    const animChannel = ShrewDirtyAspect.channels.find(channel => channel.dirtyTarget === 'animDirty');
    const actionMark = shrewChannel?.marks.find(mark => mark.bit === BIT_SHREW_ACTION);
    const progressMark = animChannel?.marks.find(mark => mark.bit === BIT_ANIM_PROGRESS);

    expect(shrewChannel?.marks.map(mark => mark.bit)).toEqual(
      SHREW_COMPONENT_RULES.map(rule => rule.bit),
    );
    expect(animChannel?.marks.map(mark => mark.bit)).toEqual(
      SHREW_ANIMATION_RULES.map(rule => rule.bit),
    );
    expect(actionMark?.fields.map(field => field.path)).toEqual(['ShrewComponent.actionState']);
    expect(actionMark?.label).toBe('动作状态');
    expect(progressMark?.fields.map(field => field.path)).toEqual(['AnimationComponent.progress']);
    expect(progressMark?.label).toBe('动画进度');
  });

  it('组件值未变化: 对应 dirty bit 为 0', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    // 第一次执行建立快照（首次全脏是正常的）
    dirtyMarkSystem(world);
    // 第二次执行，无变化时应为 0
    dirtyMarkSystem(world);

    expect(DirtyComponent.shrewDirty[eid]).toBe(0);
  });

  it('快照对象跨帧复用，避免长期运行时每帧分配临时对象', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);

    dirtyMarkSystem(world);
    const firstSnapshot = getDirtySnapshotForTest(world, 'shrew', eid);

    ShrewComponent.hp[eid] -= 1;
    dirtyMarkSystem(world);
    const secondSnapshot = getDirtySnapshotForTest(world, 'shrew', eid);

    dirtyMarkSystem(world);
    const thirdSnapshot = getDirtySnapshotForTest(world, 'shrew', eid);

    expect(firstSnapshot).toBeTruthy();
    expect(secondSnapshot).toBe(firstSnapshot);
    expect(thirdSnapshot).toBe(firstSnapshot);
  });

  it('shrewType 变化: BIT_SHREW_TYPE 被设置', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    dirtyMarkSystem(world); // 建立快照
    ShrewComponent.shrewType[eid] = ShrewType.Blue;
    dirtyMarkSystem(world); // 比较差异

    expect(DirtyComponent.shrewDirty[eid]).not.toBe(0);
  });

  it('hp 变化: BIT_SHREW_HP 被设置', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    dirtyMarkSystem(world);
    ShrewComponent.hp[eid] = 0;
    dirtyMarkSystem(world);

    expect(DirtyComponent.shrewDirty[eid]).not.toBe(0);
  });

  it('actionState 变化: BIT_SHREW_ACTION 被设置', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    dirtyMarkSystem(world);
    ShrewComponent.actionState[eid] = ShrewAction.Up;
    dirtyMarkSystem(world);

    expect(DirtyComponent.shrewDirty[eid]).not.toBe(0);
  });

  it('多个字段同时变化: 多个 bit 同时为 1', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    dirtyMarkSystem(world);
    ShrewComponent.shrewType[eid] = ShrewType.Blue;
    ShrewComponent.hp[eid] = 0;
    ShrewComponent.actionState[eid] = ShrewAction.Dizzy;
    dirtyMarkSystem(world);

    const dirty = DirtyComponent.shrewDirty[eid];
    expect(dirty).not.toBe(0);
    expect(dirty & 0x0001).toBeTruthy(); // BIT_SHREW_TYPE
    expect(dirty & 0x0002).toBeTruthy(); // BIT_SHREW_HP
    expect(dirty & 0x0004).toBeTruthy(); // BIT_SHREW_ACTION
  });

  it('animType 变化: animDirty 被设置', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    dirtyMarkSystem(world);
    AnimationComponent.animType[eid] = 1;
    dirtyMarkSystem(world);

    expect(DirtyComponent.animDirty[eid]).not.toBe(0);
  });

  it('forceFullSync: 独立于 dirty bits', () => {
    const singletons = createSingletonEntities(world);
    DirtyComponent.forceFullSync[singletons.scene] = 1;

    dirtyMarkSystem(world);

    expect(DirtyComponent.forceFullSync[singletons.scene]).toBe(1);
  });

  it('HoleComponent 变化: 位置和关联地鼠 dirty bit 被设置', () => {
    const [holeEid] = createHoleEntities(world, MapType.Meadow);
    dirtyMarkSystem(world);

    HoleComponent.posXRatio[holeEid] += 0.01;
    HoleComponent.shrewEid[holeEid] = 99;
    dirtyMarkSystem(world);

    expect(DirtyComponent.holeDirty[holeEid] & BIT_HOLE_POS).toBeTruthy();
    expect(DirtyComponent.holeDirty[holeEid] & BIT_HOLE_SHREW).toBeTruthy();
  });

  it('HammerComponent 变化: 类型、雷神状态和可击打状态 dirty bit 被设置', () => {
    const singletons = createSingletonEntities(world);
    dirtyMarkSystem(world);

    HammerComponent.selectedType[singletons.hammer] = 2;
    HammerComponent.isThunderActive[singletons.hammer] = 1;
    HammerComponent.hitTable[singletons.hammer] = 0;
    dirtyMarkSystem(world);

    expect(DirtyComponent.hammerDirty[singletons.hammer] & BIT_HAMMER_TYPE).toBeTruthy();
    expect(DirtyComponent.hammerDirty[singletons.hammer] & BIT_HAMMER_THUNDER).toBeTruthy();
    expect(DirtyComponent.hammerDirty[singletons.hammer] & BIT_HAMMER_HITTABLE).toBeTruthy();
  });

  it('SceneComponent 变化: 地图、计时和过渡 dirty bit 被设置', () => {
    const singletons = createSingletonEntities(world);
    dirtyMarkSystem(world);

    SceneComponent.currentMap[singletons.scene] = MapType.Ship;
    SceneComponent.sceneTimer[singletons.scene] = 1;
    SceneComponent.transitioning[singletons.scene] = 1;
    dirtyMarkSystem(world);

    expect(DirtyComponent.sceneDirty[singletons.scene] & BIT_SCENE_MAP).toBeTruthy();
    expect(DirtyComponent.sceneDirty[singletons.scene] & BIT_SCENE_TIMER).toBeTruthy();
    expect(DirtyComponent.sceneDirty[singletons.scene] & BIT_SCENE_TRANSITION).toBeTruthy();
  });

  it('PlayerComponent 变化: HUD 相关 dirty bit 被设置', () => {
    const singletons = createSingletonEntities(world);
    dirtyMarkSystem(world);

    PlayerComponent.money[singletons.player] = 100;
    PlayerComponent.angry[singletons.player] = 50;
    PlayerComponent.power[singletons.player] = 10;
    PlayerComponent.powerTop[singletons.player] = 100;
    PlayerComponent.level[singletons.player] = 2;
    dirtyMarkSystem(world);

    expect(DirtyComponent.playerDirty[singletons.player] & BIT_PLAYER_MONEY).toBeTruthy();
    expect(DirtyComponent.playerDirty[singletons.player] & BIT_PLAYER_ANGRY).toBeTruthy();
    expect(DirtyComponent.playerDirty[singletons.player] & BIT_PLAYER_POWER).toBeTruthy();
    expect(DirtyComponent.playerDirty[singletons.player] & BIT_PLAYER_LEVEL).toBeTruthy();
  });

  it('ComboComponent 变化: 次数、ID 和目标 dirty bit 被设置', () => {
    const singletons = createSingletonEntities(world);
    dirtyMarkSystem(world);

    ComboComponent.comboCount[singletons.combo] = 2;
    ComboComponent.comboID[singletons.combo] = 7;
    ComboComponent.targetHole0[singletons.combo] = 1;
    dirtyMarkSystem(world);

    expect(DirtyComponent.comboDirty[singletons.combo] & BIT_COMBO_COUNT).toBeTruthy();
    expect(DirtyComponent.comboDirty[singletons.combo] & BIT_COMBO_ID).toBeTruthy();
    expect(DirtyComponent.comboDirty[singletons.combo] & BIT_COMBO_TARGETS).toBeTruthy();
  });

  it('HitComponent 变化: 命中索引、奖励和命中状态 dirty bit 被设置', () => {
    const hitEid = addEntity(world);
    addComponent(world, HitComponent, hitEid);
    addComponent(world, DirtyComponent, hitEid);
    dirtyMarkSystem(world);

    HitComponent.shrewIndex[hitEid] = 3;
    HitComponent.reward[hitEid] = 50;
    HitComponent.wasHit[hitEid] = 1;
    dirtyMarkSystem(world);

    expect(DirtyComponent.hitDirty[hitEid] & BIT_HIT_INDEX).toBeTruthy();
    expect(DirtyComponent.hitDirty[hitEid] & BIT_HIT_REWARD).toBeTruthy();
    expect(DirtyComponent.hitDirty[hitEid] & BIT_HIT_WASHIT).toBeTruthy();
  });

  it('PerfHeroComponent 变化: 位置和重生序号 dirty bit 被设置', () => {
    const [eid] = createPerfHeroEntities(world, 1);
    dirtyMarkSystem(world);

    PerfHeroComponent.posX[eid] += 1;
    PerfHeroComponent.spawnSeq[eid] += 1;
    dirtyMarkSystem(world);

    expect(DirtyComponent.perfHeroDirty[eid] & BIT_PERF_HERO_POS).toBeTruthy();
    expect(DirtyComponent.perfHeroDirty[eid] & BIT_PERF_HERO_SPAWN).toBeTruthy();
  });
});
