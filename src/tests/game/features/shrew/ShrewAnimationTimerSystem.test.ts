import { describe, it, expect, beforeEach } from 'vitest';
import { createGameWorld } from '../../../../framework/ecs/GameWorld';
import { createSingletonEntities } from '../../../helpers/SingletonTestEntities';
import { createShrewEntity } from '../../../helpers/CoreTestEntities';
import {
  AnimationComponent,
  AnimType,
  ShrewType,
  shrewAnimationTimerSystem,
} from "../../../../game/features/shrew";
import { MapType, SceneComponent } from "../../../../game/features/board";

describe('ShrewAnimationTimerSystem', () => {
  let world: ReturnType<typeof createGameWorld>;

  beforeEach(() => {
    world = createGameWorld();
  });

  it('animTimer 推进：delta=1/60 时 progress 增加', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    AnimationComponent.duration[eid] = 0.31;
    AnimationComponent.progress[eid] = 0;

    const delta = 1 / 60;
    shrewAnimationTimerSystem(world, delta);

    const progress = AnimationComponent.progress[eid];
    expect(progress).toBeGreaterThan(0);
    expect(progress).toBeCloseTo(delta / 0.31, 3);
  });

  it('progress 达到 1.0 时标记动画完成', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    AnimationComponent.duration[eid] = 0.31;
    AnimationComponent.progress[eid] = 0.99;
    AnimationComponent.animType[eid] = AnimType.Up;

    shrewAnimationTimerSystem(world, 0.1);

    expect(AnimationComponent.progress[eid]).toBeGreaterThanOrEqual(1.0);
    expect(AnimationComponent.animType[eid]).toBe(AnimType.Up);
  });

  it('delta=0 时 progress 不推进', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    AnimationComponent.duration[eid] = 0.31;
    AnimationComponent.progress[eid] = 0.5;

    shrewAnimationTimerSystem(world, 0);

    expect(AnimationComponent.progress[eid]).toBe(0.5);
  });

  it('duration=0 时 progress 不推进 (防止除零)', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    AnimationComponent.duration[eid] = 0;
    AnimationComponent.progress[eid] = 0;

    shrewAnimationTimerSystem(world, 1 / 60);

    expect(AnimationComponent.progress[eid]).toBe(0);
  });

  it('多个实体同时推进', () => {
    const eid1 = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    const eid2 = createShrewEntity(world, ShrewType.Blue, MapType.Ship);

    AnimationComponent.duration[eid1] = 0.31;
    AnimationComponent.progress[eid1] = 0;
    AnimationComponent.duration[eid2] = 2.0;
    AnimationComponent.progress[eid2] = 0.5;

    const delta = 1 / 60;
    shrewAnimationTimerSystem(world, delta);

    expect(AnimationComponent.progress[eid1]).toBeCloseTo(delta / 0.31, 3);
    expect(AnimationComponent.progress[eid2]).toBeCloseTo(0.5 + delta / 2.0, 3);
  });

  it('不再推进 sceneTimer，场景时间由 board 系统负责', () => {
    const singletons = createSingletonEntities(world);
    const sceneEid = singletons.scene;

    shrewAnimationTimerSystem(world, 1.5);

    expect(SceneComponent.sceneTimer[sceneEid]).toBe(0);
  });
});
