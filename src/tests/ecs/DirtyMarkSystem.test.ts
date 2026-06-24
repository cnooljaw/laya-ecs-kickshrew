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
  PerfHeroComponent,
} from '../../ecs/components';
import { ShrewType, ShrewAction, MapType } from '../../ecs/types';
import { dirtyMarkSystem, getDirtySnapshotForTest } from '../../sync/dirty/DirtyMarkSystem';
import { SHREW_COMPONENT_SYNC_SPEC, SHREW_ANIMATION_SYNC_SPEC } from '../../sync/viewSync/specs/ShrewViewSyncSpec';
import { HOLE_VIEW_SYNC_SPEC } from '../../sync/viewSync/specs/HoleViewSyncSpec';
import { HAMMER_VIEW_SYNC_SPEC } from '../../sync/viewSync/specs/HammerViewSyncSpec';
import { SCENE_VIEW_SYNC_SPEC } from '../../sync/viewSync/specs/SceneViewSyncSpec';
import { PLAYER_VIEW_SYNC_SPEC } from '../../sync/viewSync/specs/PlayerViewSyncSpec';
import { HIT_VIEW_SYNC_SPEC } from '../../sync/viewSync/specs/HitViewSyncSpec';
import { PERF_HERO_VIEW_SYNC_SPEC } from '../../sync/viewSync/specs/PerfHeroViewSyncSpec';
import { MONSTER_VIEW_SYNC_SPEC } from '../../sync/viewSync/specs/MonsterViewSyncSpec';
import { GAME_FEATURE_REGISTRY } from '../../features/GameFeatures';
import {
  HammerViewSync,
  HitViewSync,
  HoleViewSync,
  MonsterViewSync,
  PerfHeroViewSync,
  PlayerViewSync,
  SceneViewSync,
  ShrewAnimationViewSync,
  ShrewViewSync,
} from '../../binding/viewSyncs';
import { bitsOf } from '../../sync/viewSync/ViewSyncSpec';
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
  BIT_PERF_HERO_POS,
  BIT_PERF_HERO_SPAWN,
} from '../../sync/DirtyFlags';

describe('DirtyMarkSystem', () => {
  let world: ReturnType<typeof createGameWorld>;

  beforeEach(() => {
    world = createGameWorld();
  });

  function markDirty(): void {
    dirtyMarkSystem(world, GAME_FEATURE_REGISTRY.dirtyAspects());
  }

  it('Shrew ViewSyncModule 由表格式 ViewSyncSpec 派生 dirty marks', () => {
    expect(ShrewViewSync.dirtyAspect.requires).toEqual([
      'ShrewComponent',
      'AnimationComponent',
      'DirtyComponent',
    ]);

    const shrewChannel = ShrewViewSync.dirtyAspect.channels.find(channel => channel.dirtyTarget === 'shrewDirty');
    const animChannel = ShrewAnimationViewSync.dirtyAspect.channels.find(channel => channel.dirtyTarget === 'animDirty');
    const actionMark = shrewChannel?.marks.find(mark => mark.bit === BIT_SHREW_ACTION);
    const progressMark = animChannel?.marks.find(mark => mark.bit === BIT_ANIM_PROGRESS);

    expect(shrewChannel?.marks.map(mark => mark.bit)).toEqual(
      SHREW_COMPONENT_SYNC_SPEC.map(rule => rule.bit),
    );
    expect(animChannel?.marks.map(mark => mark.bit)).toEqual(
      SHREW_ANIMATION_SYNC_SPEC.map(rule => rule.bit),
    );
    expect(actionMark?.fields.map(field => field.path)).toEqual(['ShrewComponent.actionState']);
    expect(actionMark?.label).toBe('动作状态');
    expect(progressMark?.fields.map(field => field.path)).toEqual(['AnimationComponent.progress']);
    expect(progressMark?.label).toBe('动画进度');
  });

  it('ViewSyncModule 能描述字段到 channel 的同步路径', () => {
    expect(ShrewViewSync.describe()[0]).toBe(
      'ShrewComponent.shrewType -> shrewDirty.地鼠类型 -> shrew',
    );
    expect(ShrewAnimationViewSync.describe()[0]).toBe(
      'AnimationComponent.animType -> animDirty.动画类型 -> anim',
    );
  });

  it('所有 ViewSyncModule dirtyAspect 都由对应 ViewSyncSpec 派生，并且不再携带 viewTarget 字符串', () => {
    const cases = [
      { aspect: ShrewViewSync.dirtyAspect, dirtyTarget: 'shrewDirty', spec: SHREW_COMPONENT_SYNC_SPEC },
      { aspect: ShrewAnimationViewSync.dirtyAspect, dirtyTarget: 'animDirty', spec: SHREW_ANIMATION_SYNC_SPEC },
      { aspect: HoleViewSync.dirtyAspect, dirtyTarget: 'holeDirty', spec: HOLE_VIEW_SYNC_SPEC },
      { aspect: HammerViewSync.dirtyAspect, dirtyTarget: 'hammerDirty', spec: HAMMER_VIEW_SYNC_SPEC },
      { aspect: SceneViewSync.dirtyAspect, dirtyTarget: 'sceneDirty', spec: SCENE_VIEW_SYNC_SPEC },
      { aspect: PlayerViewSync.dirtyAspect, dirtyTarget: 'playerDirty', spec: PLAYER_VIEW_SYNC_SPEC },
      { aspect: HitViewSync.dirtyAspect, dirtyTarget: 'hitDirty', spec: HIT_VIEW_SYNC_SPEC },
      { aspect: PerfHeroViewSync.dirtyAspect, dirtyTarget: 'perfHeroDirty', spec: PERF_HERO_VIEW_SYNC_SPEC },
      { aspect: MonsterViewSync.dirtyAspect, dirtyTarget: 'monsterDirty', spec: MONSTER_VIEW_SYNC_SPEC },
    ];

    for (const { aspect, dirtyTarget, spec } of cases) {
      const channel = aspect.channels.find(channel => channel.dirtyTarget === dirtyTarget);
      expect(channel?.marks.map(mark => mark.bit)).toEqual(spec.map(row => row.bit));
      expect(channel?.marks.map(mark => mark.fields.map(field => field.path))).toEqual(
        spec.map(row => row.dirtyFields.map(field => field.path)),
      );
      expect(channel?.marks.every(mark => !('viewTarget' in mark))).toBe(true);
    }
  });

  it('每个 DirtyChannel 的 allBits 必须覆盖对应 ViewSyncSpec 的全部 bit', () => {
    const cases = [
      { aspect: ShrewViewSync.dirtyAspect, dirtyTarget: 'shrewDirty', spec: SHREW_COMPONENT_SYNC_SPEC },
      { aspect: ShrewAnimationViewSync.dirtyAspect, dirtyTarget: 'animDirty', spec: SHREW_ANIMATION_SYNC_SPEC },
      { aspect: HoleViewSync.dirtyAspect, dirtyTarget: 'holeDirty', spec: HOLE_VIEW_SYNC_SPEC },
      { aspect: HammerViewSync.dirtyAspect, dirtyTarget: 'hammerDirty', spec: HAMMER_VIEW_SYNC_SPEC },
      { aspect: SceneViewSync.dirtyAspect, dirtyTarget: 'sceneDirty', spec: SCENE_VIEW_SYNC_SPEC },
      { aspect: PlayerViewSync.dirtyAspect, dirtyTarget: 'playerDirty', spec: PLAYER_VIEW_SYNC_SPEC },
      { aspect: HitViewSync.dirtyAspect, dirtyTarget: 'hitDirty', spec: HIT_VIEW_SYNC_SPEC },
      { aspect: PerfHeroViewSync.dirtyAspect, dirtyTarget: 'perfHeroDirty', spec: PERF_HERO_VIEW_SYNC_SPEC },
      { aspect: MonsterViewSync.dirtyAspect, dirtyTarget: 'monsterDirty', spec: MONSTER_VIEW_SYNC_SPEC },
    ];

    for (const { aspect, dirtyTarget, spec } of cases) {
      const channel = aspect.channels.find(channel => channel.dirtyTarget === dirtyTarget);
      expect(channel?.allBits).toBe(bitsOf(spec));
    }
  });

  it('组件值未变化: 对应 dirty bit 为 0', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    // 第一次执行建立快照（首次全脏是正常的）
    markDirty();
    // 第二次执行，无变化时应为 0
    markDirty();

    expect(DirtyComponent.shrewDirty[eid]).toBe(0);
  });

  it('快照对象跨帧复用，避免长期运行时每帧分配临时对象', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);

    markDirty();
    const firstSnapshot = getDirtySnapshotForTest(world, 'shrew', eid);

    ShrewComponent.hp[eid] -= 1;
    markDirty();
    const secondSnapshot = getDirtySnapshotForTest(world, 'shrew', eid);

    markDirty();
    const thirdSnapshot = getDirtySnapshotForTest(world, 'shrew', eid);

    expect(firstSnapshot).toBeTruthy();
    expect(secondSnapshot).toBe(firstSnapshot);
    expect(thirdSnapshot).toBe(firstSnapshot);
  });

  it('shrewType 变化: BIT_SHREW_TYPE 被设置', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    markDirty(); // 建立快照
    ShrewComponent.shrewType[eid] = ShrewType.Blue;
    markDirty(); // 比较差异

    expect(DirtyComponent.shrewDirty[eid]).not.toBe(0);
  });

  it('hp 变化: BIT_SHREW_HP 被设置', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    markDirty();
    ShrewComponent.hp[eid] = 0;
    markDirty();

    expect(DirtyComponent.shrewDirty[eid]).not.toBe(0);
  });

  it('actionState 变化: BIT_SHREW_ACTION 被设置', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    markDirty();
    ShrewComponent.actionState[eid] = ShrewAction.Up;
    markDirty();

    expect(DirtyComponent.shrewDirty[eid]).not.toBe(0);
  });

  it('多个字段同时变化: 多个 bit 同时为 1', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    markDirty();
    ShrewComponent.shrewType[eid] = ShrewType.Blue;
    ShrewComponent.hp[eid] = 0;
    ShrewComponent.actionState[eid] = ShrewAction.Dizzy;
    markDirty();

    const dirty = DirtyComponent.shrewDirty[eid];
    expect(dirty).not.toBe(0);
    expect(dirty & 0x0001).toBeTruthy(); // BIT_SHREW_TYPE
    expect(dirty & 0x0002).toBeTruthy(); // BIT_SHREW_HP
    expect(dirty & 0x0004).toBeTruthy(); // BIT_SHREW_ACTION
  });

  it('animType 变化: animDirty 被设置', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    markDirty();
    AnimationComponent.animType[eid] = 1;
    markDirty();

    expect(DirtyComponent.animDirty[eid]).not.toBe(0);
  });

  it('forceFullSync: 独立于 dirty bits', () => {
    const singletons = createSingletonEntities(world);
    DirtyComponent.forceFullSync[singletons.scene] = 1;

    markDirty();

    expect(DirtyComponent.forceFullSync[singletons.scene]).toBe(1);
  });

  it('HoleComponent 变化: 位置和关联地鼠 dirty bit 被设置', () => {
    const [holeEid] = createHoleEntities(world, MapType.Meadow);
    markDirty();

    HoleComponent.posXRatio[holeEid] += 0.01;
    HoleComponent.shrewEid[holeEid] = 99;
    markDirty();

    expect(DirtyComponent.holeDirty[holeEid] & BIT_HOLE_POS).toBeTruthy();
    expect(DirtyComponent.holeDirty[holeEid] & BIT_HOLE_SHREW).toBeTruthy();
  });

  it('HammerComponent 变化: 类型、雷神状态和可击打状态 dirty bit 被设置', () => {
    const singletons = createSingletonEntities(world);
    markDirty();

    HammerComponent.selectedType[singletons.hammer] = 2;
    HammerComponent.isThunderActive[singletons.hammer] = 1;
    HammerComponent.hitTable[singletons.hammer] = 0;
    markDirty();

    expect(DirtyComponent.hammerDirty[singletons.hammer] & BIT_HAMMER_TYPE).toBeTruthy();
    expect(DirtyComponent.hammerDirty[singletons.hammer] & BIT_HAMMER_THUNDER).toBeTruthy();
    expect(DirtyComponent.hammerDirty[singletons.hammer] & BIT_HAMMER_HITTABLE).toBeTruthy();
  });

  it('SceneComponent 变化: 地图、计时和过渡 dirty bit 被设置', () => {
    const singletons = createSingletonEntities(world);
    markDirty();

    SceneComponent.currentMap[singletons.scene] = MapType.Ship;
    SceneComponent.sceneTimer[singletons.scene] = 1;
    SceneComponent.transitioning[singletons.scene] = 1;
    markDirty();

    expect(DirtyComponent.sceneDirty[singletons.scene] & BIT_SCENE_MAP).toBeTruthy();
    expect(DirtyComponent.sceneDirty[singletons.scene] & BIT_SCENE_TIMER).toBeTruthy();
    expect(DirtyComponent.sceneDirty[singletons.scene] & BIT_SCENE_TRANSITION).toBeTruthy();
  });

  it('PlayerComponent 变化: HUD 相关 dirty bit 被设置', () => {
    const singletons = createSingletonEntities(world);
    markDirty();

    PlayerComponent.money[singletons.player] = 100;
    PlayerComponent.angry[singletons.player] = 50;
    PlayerComponent.power[singletons.player] = 10;
    PlayerComponent.powerTop[singletons.player] = 100;
    PlayerComponent.level[singletons.player] = 2;
    markDirty();

    expect(DirtyComponent.playerDirty[singletons.player] & BIT_PLAYER_MONEY).toBeTruthy();
    expect(DirtyComponent.playerDirty[singletons.player] & BIT_PLAYER_ANGRY).toBeTruthy();
    expect(DirtyComponent.playerDirty[singletons.player] & BIT_PLAYER_POWER).toBeTruthy();
    expect(DirtyComponent.playerDirty[singletons.player] & BIT_PLAYER_LEVEL).toBeTruthy();
  });

  it('HitComponent 变化: 命中索引、奖励和命中状态 dirty bit 被设置', () => {
    const hitEid = addEntity(world);
    addComponent(world, HitComponent, hitEid);
    addComponent(world, DirtyComponent, hitEid);
    markDirty();

    HitComponent.shrewIndex[hitEid] = 3;
    HitComponent.reward[hitEid] = 50;
    HitComponent.wasHit[hitEid] = 1;
    markDirty();

    expect(DirtyComponent.hitDirty[hitEid] & BIT_HIT_INDEX).toBeTruthy();
    expect(DirtyComponent.hitDirty[hitEid] & BIT_HIT_REWARD).toBeTruthy();
    expect(DirtyComponent.hitDirty[hitEid] & BIT_HIT_WASHIT).toBeTruthy();
  });

  it('PerfHeroComponent 变化: 位置和重生序号 dirty bit 被设置', () => {
    const [eid] = createPerfHeroEntities(world, 1);
    markDirty();

    PerfHeroComponent.posX[eid] += 1;
    PerfHeroComponent.spawnSeq[eid] += 1;
    markDirty();

    expect(DirtyComponent.perfHeroDirty[eid] & BIT_PERF_HERO_POS).toBeTruthy();
    expect(DirtyComponent.perfHeroDirty[eid] & BIT_PERF_HERO_SPAWN).toBeTruthy();
  });
});
