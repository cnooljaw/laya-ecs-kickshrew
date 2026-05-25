import { describe, it, expect, beforeEach } from 'vitest';
import { createGameWorld, createShrewEntity, createSingletonEntities } from '../../ecs/world';
import { ShrewComponent, DirtyComponent, AnimationComponent } from '../../ecs/components';
import { ShrewType, ShrewAction, MapType } from '../../ecs/types';
import { dirtyMarkSystem } from '../../ecs/systems/DirtyMarkSystem';

describe('DirtyMarkSystem', () => {
  let world: ReturnType<typeof createGameWorld>;

  beforeEach(() => {
    world = createGameWorld();
  });

  it('组件值未变化: 对应 dirty bit 为 0', () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    // 第一次执行建立快照（首次全脏是正常的）
    dirtyMarkSystem(world);
    // 第二次执行，无变化时应为 0
    dirtyMarkSystem(world);

    expect(DirtyComponent.shrewDirty[eid]).toBe(0);
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
});
