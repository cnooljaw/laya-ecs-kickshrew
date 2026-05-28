import { describe, it, expect, beforeEach } from 'vitest';
import { createGameWorld, createShrewEntity, createHoleEntities, createSingletonEntities } from '../../ecs/world';
import { SceneComponent, ShrewComponent, DirtyComponent } from '../../ecs/components';
import { MapType, ShrewAction, ShrewType, HOLE_COUNT } from '../../ecs/types';
import { SCENE_CYCLE_INTERVAL } from '../../config/SceneConfig';
import { sceneCycleSystem } from '../../ecs/systems/SceneCycleSystem';

describe('SceneCycleSystem', () => {
  let world: ReturnType<typeof createGameWorld>;
  let singletons: ReturnType<typeof createSingletonEntities>;
  let holes: number[];
  let shrews: number[];

  beforeEach(() => {
    world = createGameWorld();
    singletons = createSingletonEntities(world);
    holes = createHoleEntities(world, MapType.Meadow);
    shrews = [];

    // 创建地鼠
    for (let i = 0; i < HOLE_COUNT; i++) {
      const shrewEid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
      ShrewComponent.actionState[shrewEid] = ShrewAction.Stand;
      ShrewComponent.isClickable[shrewEid] = 1;
      shrews.push(shrewEid);
    }
  });

  it('sceneTimer < cycleInterval: 不切换场景', () => {
    SceneComponent.sceneTimer[singletons.scene] = SCENE_CYCLE_INTERVAL - 0.01;
    SceneComponent.cycleInterval[singletons.scene] = SCENE_CYCLE_INTERVAL;

    sceneCycleSystem(world);

    expect(SceneComponent.currentMap[singletons.scene]).toBe(MapType.Meadow);
  });

  it('sceneTimer >= cycleInterval: 切换到下一个场景', () => {
    SceneComponent.sceneTimer[singletons.scene] = SCENE_CYCLE_INTERVAL;
    SceneComponent.cycleInterval[singletons.scene] = SCENE_CYCLE_INTERVAL;
    SceneComponent.currentMap[singletons.scene] = MapType.Meadow;

    sceneCycleSystem(world);

    expect(SceneComponent.currentMap[singletons.scene]).toBe(MapType.Ship);
  });

  it('场景循环 Meadow→Ship→Space→Meadow', () => {
    SceneComponent.cycleInterval[singletons.scene] = SCENE_CYCLE_INTERVAL;

    // Meadow → Ship
    SceneComponent.sceneTimer[singletons.scene] = SCENE_CYCLE_INTERVAL;
    SceneComponent.currentMap[singletons.scene] = MapType.Meadow;
    sceneCycleSystem(world);
    expect(SceneComponent.currentMap[singletons.scene]).toBe(MapType.Ship);

    // Ship → Space
    SceneComponent.sceneTimer[singletons.scene] = SCENE_CYCLE_INTERVAL;
    sceneCycleSystem(world);
    expect(SceneComponent.currentMap[singletons.scene]).toBe(MapType.Space);

    // Space → Meadow
    SceneComponent.sceneTimer[singletons.scene] = SCENE_CYCLE_INTERVAL;
    sceneCycleSystem(world);
    expect(SceneComponent.currentMap[singletons.scene]).toBe(MapType.Meadow);
  });

  it('切换时重置 sceneTimer', () => {
    SceneComponent.sceneTimer[singletons.scene] = SCENE_CYCLE_INTERVAL * 1.5;
    SceneComponent.cycleInterval[singletons.scene] = SCENE_CYCLE_INTERVAL;

    sceneCycleSystem(world);

    expect(SceneComponent.sceneTimer[singletons.scene]).toBe(0);
  });

  it('切换时设置 forceFullSync=1', () => {
    SceneComponent.sceneTimer[singletons.scene] = SCENE_CYCLE_INTERVAL;
    SceneComponent.cycleInterval[singletons.scene] = SCENE_CYCLE_INTERVAL;

    sceneCycleSystem(world);

    // 检查场景实体的 forceFullSync
    expect(DirtyComponent.forceFullSync[singletons.scene]).toBe(1);
  });

  it('切换时所有地鼠重置为 Wait', () => {
    SceneComponent.sceneTimer[singletons.scene] = SCENE_CYCLE_INTERVAL;
    SceneComponent.cycleInterval[singletons.scene] = SCENE_CYCLE_INTERVAL;

    sceneCycleSystem(world);

    for (const shrewEid of shrews) {
      expect(ShrewComponent.actionState[shrewEid]).toBe(ShrewAction.Wait);
      expect(ShrewComponent.isClickable[shrewEid]).toBe(0);
      expect(ShrewComponent.animTimer[shrewEid]).toBeGreaterThanOrEqual(1);
      expect(ShrewComponent.animTimer[shrewEid]).toBeLessThanOrEqual(8);
      expect(ShrewComponent.mapType[shrewEid]).toBe(MapType.Ship);
      expect(DirtyComponent.forceFullSync[shrewEid]).toBe(1);
    }
  });
});
