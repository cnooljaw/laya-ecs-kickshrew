import { describe, it, expect, beforeEach } from 'vitest';
import { createGameWorld, createShrewEntity, createHoleEntities, createSingletonEntities } from '../../ecs/world';
import { ShrewComponent, HoleComponent, ComboComponent } from '../../ecs/components';
import { ShrewType, ShrewAction, MapType, HOLE_COUNT, GRID_SIZE } from '../../ecs/types';
import { comboSystem, getAdjacentHoles } from '../../ecs/systems/ComboSystem';

describe('ComboSystem', () => {
  let world: ReturnType<typeof createGameWorld>;
  let holes: number[];
  let singletons: ReturnType<typeof createSingletonEntities>;

  beforeEach(() => {
    world = createGameWorld();
    singletons = createSingletonEntities(world);
    holes = createHoleEntities(world, MapType.Meadow);

    // 为每个洞位创建地鼠
    for (let i = 0; i < HOLE_COUNT; i++) {
      const shrewEid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
      HoleComponent.shrewEid[holes[i]] = shrewEid;
    }
  });

  // ---- 相邻洞位计算 ----

  describe('getAdjacentHoles', () => {
    it('洞位(0,0) 的相邻洞位包含 (0,1), (1,0), (1,1)', () => {
      const adjacent = getAdjacentHoles(0, 0);
      // (0,0) → index 0, 相邻: (0,1)=1, (1,0)=3, (1,1)=4
      expect(adjacent).toContain(1);
      expect(adjacent).toContain(3);
      expect(adjacent).toContain(4);
      expect(adjacent.length).toBe(3);
    });

    it('洞位(1,1) 中心有 8 个相邻洞位', () => {
      const adjacent = getAdjacentHoles(1, 1);
      // (1,1) → index 4, 所有其他8个洞位都是相邻的
      expect(adjacent.length).toBe(8);
    });

    it('洞位(2,2) 角落有 3 个相邻洞位', () => {
      const adjacent = getAdjacentHoles(2, 2);
      // (2,2) → index 8, 相邻: (1,1)=4, (1,2)=5, (2,1)=7
      expect(adjacent).toContain(4);
      expect(adjacent).toContain(5);
      expect(adjacent).toContain(7);
      expect(adjacent.length).toBe(3);
    });

    it('洞位(0,2) 角落有 3 个相邻洞位', () => {
      const adjacent = getAdjacentHoles(0, 2);
      // (0,2) → index 2, 相邻: (0,1)=1, (1,1)=4, (1,2)=5
      expect(adjacent).toContain(1);
      expect(adjacent).toContain(4);
      expect(adjacent).toContain(5);
      expect(adjacent.length).toBe(3);
    });
  });

  // ---- 连击系统逻辑 ----

  describe('comboSystem', () => {
    it('comboCount=0 时不计算连击', () => {
      ComboComponent.comboCount[singletons.combo] = 0;

      comboSystem(world);

      expect(ComboComponent.targetHole0[singletons.combo]).toBe(0);
      expect(ComboComponent.targetHole1[singletons.combo]).toBe(0);
      expect(ComboComponent.targetHole2[singletons.combo]).toBe(0);
    });

    it('击中洞位0的相邻可点击地鼠作为连击目标', () => {
      // 设置击中洞位为 index 0
      ComboComponent.comboCount[singletons.combo] = 1;
      ComboComponent.comboID[singletons.combo] = 1;

      // 让相邻洞位(1,3,4)的地鼠可点击
      const shrew1 = HoleComponent.shrewEid[holes[1]];
      const shrew3 = HoleComponent.shrewEid[holes[3]];
      const shrew4 = HoleComponent.shrewEid[holes[4]];
      ShrewComponent.isClickable[shrew1] = 1;
      ShrewComponent.isClickable[shrew3] = 1;
      ShrewComponent.isClickable[shrew4] = 1;

      // 传入 hitHoleIndex=0
      comboSystem(world, 0);

      // 应该有最多3个连击目标
      const targets = [
        ComboComponent.targetHole0[singletons.combo],
        ComboComponent.targetHole1[singletons.combo],
        ComboComponent.targetHole2[singletons.combo],
      ];
      const nonZeroTargets = targets.filter(t => t > 0);
      expect(nonZeroTargets.length).toBeLessThanOrEqual(3);
      expect(nonZeroTargets.length).toBeGreaterThan(0);
    });

    it('相邻洞位全部不可点击时连击目标为空', () => {
      ComboComponent.comboCount[singletons.combo] = 1;
      ComboComponent.comboID[singletons.combo] = 1;

      // 所有地鼠 isClickable=0
      for (let i = 0; i < HOLE_COUNT; i++) {
        const shrewEid = HoleComponent.shrewEid[holes[i]];
        ShrewComponent.isClickable[shrewEid] = 0;
      }

      comboSystem(world, 0);

      expect(ComboComponent.targetHole0[singletons.combo]).toBe(0);
      expect(ComboComponent.targetHole1[singletons.combo]).toBe(0);
      expect(ComboComponent.targetHole2[singletons.combo]).toBe(0);
    });

    it('连击目标最多3个', () => {
      ComboComponent.comboCount[singletons.combo] = 1;
      ComboComponent.comboID[singletons.combo] = 1;

      // 让中心洞位(1,1)=index4 的8个相邻洞位都可点击
      for (let i = 0; i < HOLE_COUNT; i++) {
        if (i === 4) continue; // 跳过自己
        const shrewEid = HoleComponent.shrewEid[holes[i]];
        ShrewComponent.isClickable[shrewEid] = 1;
      }

      comboSystem(world, 4);

      const targets = [
        ComboComponent.targetHole0[singletons.combo],
        ComboComponent.targetHole1[singletons.combo],
        ComboComponent.targetHole2[singletons.combo],
      ];
      const nonZeroTargets = targets.filter(t => t > 0);
      expect(nonZeroTargets.length).toBeLessThanOrEqual(3);
    });
  });
});
