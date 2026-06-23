import { describe, it, expect } from "vitest";
import { createWorld, addEntity, removeEntity, addComponent, hasComponent, Types, defineComponent } from "bitecs";
import { ShrewType, ShrewAction, MapType, HammerType, HOLE_COUNT } from "../../ecs/types";
import { SCENE_CYCLE_INTERVAL } from "../../config/SceneConfig";
import { HolePositions } from "../../config/HolePositions";
import {
  ShrewComponent,
  HoleComponent,
  HammerComponent,
  SceneComponent,
  PlayerComponent,
  AnimationComponent,
  HitComponent,
  NetworkComponent,
  DirtyComponent,
} from "../../ecs/components";
import { createGameWorld, createShrewEntity, createHoleEntities, createSingletonEntities } from "../../ecs/world";

describe("ECS Components & World", () => {
  describe("Component Definitions", () => {
    it("ShrewComponent should have correct fields", () => {
      const world = createWorld();
      const entity = addEntity(world);
      addComponent(world, ShrewComponent, entity);

      // Set values
      ShrewComponent.shrewType[entity] = ShrewType.Red;
      ShrewComponent.hp[entity] = 1;
      ShrewComponent.actionState[entity] = ShrewAction.Wait;
      ShrewComponent.hasHat[entity] = 0;
      ShrewComponent.mapType[entity] = MapType.Meadow;
      ShrewComponent.isClickable[entity] = 0;
      ShrewComponent.animTimer[entity] = 0;
      ShrewComponent.propType[entity] = 0;

      expect(hasComponent(world, ShrewComponent, entity)).toBe(true);
      expect(ShrewComponent.shrewType[entity]).toBe(ShrewType.Red);
      expect(ShrewComponent.hp[entity]).toBe(1);
      expect(ShrewComponent.actionState[entity]).toBe(ShrewAction.Wait);
    });

    it("HoleComponent should have correct fields", () => {
      const world = createWorld();
      const entity = addEntity(world);
      addComponent(world, HoleComponent, entity);

      HoleComponent.gridRow[entity] = 0;
      HoleComponent.gridCol[entity] = 1;
      HoleComponent.posXRatio[entity] = 0.5;
      HoleComponent.posYRatio[entity] = 0.37;
      HoleComponent.shrewEid[entity] = 0;
      HoleComponent.zIndex[entity] = 4;

      expect(hasComponent(world, HoleComponent, entity)).toBe(true);
      expect(HoleComponent.gridRow[entity]).toBe(0);
      expect(HoleComponent.gridCol[entity]).toBe(1);
    });

    it("HammerComponent should have correct fields", () => {
      const world = createWorld();
      const entity = addEntity(world);
      addComponent(world, HammerComponent, entity);

      HammerComponent.selectedType[entity] = HammerType.Wood;
      HammerComponent.isThunderActive[entity] = 0;
      HammerComponent.hitTable[entity] = 1;
      HammerComponent.hitCooldownSec[entity] = 0;

      expect(HammerComponent.selectedType[entity]).toBe(HammerType.Wood);
      expect(HammerComponent.hitTable[entity]).toBe(1);
      expect(HammerComponent.hitCooldownSec[entity]).toBe(0);
    });

    it("DirtyComponent should have correct fields", () => {
      const world = createWorld();
      const entity = addEntity(world);
      addComponent(world, DirtyComponent, entity);

      DirtyComponent.shrewDirty[entity] = 0;
      DirtyComponent.forceFullSync[entity] = 0;

      expect(DirtyComponent.shrewDirty[entity]).toBe(0);
    });
  });

  describe("createShrewEntity", () => {
    it("should create red shrew with hp=1", () => {
      const world = createGameWorld();
      const entity = createShrewEntity(world, ShrewType.Red, MapType.Meadow);

      expect(hasComponent(world, ShrewComponent, entity)).toBe(true);
      expect(ShrewComponent.shrewType[entity]).toBe(ShrewType.Red);
      expect(ShrewComponent.hp[entity]).toBe(1);
      expect(ShrewComponent.actionState[entity]).toBe(ShrewAction.Wait);
      expect(ShrewComponent.animTimer[entity]).toBeGreaterThanOrEqual(1);
      expect(ShrewComponent.animTimer[entity]).toBeLessThanOrEqual(8);
      expect(ShrewComponent.hasHat[entity]).toBe(0);
      expect(ShrewComponent.mapType[entity]).toBe(MapType.Meadow);
      expect(ShrewComponent.isClickable[entity]).toBe(0);
    });

    it("should create blue shrew with hp=2 and hasHat=1", () => {
      const world = createGameWorld();
      const entity = createShrewEntity(world, ShrewType.Blue, MapType.Meadow);

      expect(ShrewComponent.shrewType[entity]).toBe(ShrewType.Blue);
      expect(ShrewComponent.hp[entity]).toBe(2);
      expect(ShrewComponent.hasHat[entity]).toBe(1);
    });

    it("should create yellow shrew with hp=1", () => {
      const world = createGameWorld();
      const entity = createShrewEntity(world, ShrewType.Yellow, MapType.Ship);

      expect(ShrewComponent.shrewType[entity]).toBe(ShrewType.Yellow);
      expect(ShrewComponent.hp[entity]).toBe(1);
      expect(ShrewComponent.mapType[entity]).toBe(MapType.Ship);
    });

    it("should create green shrew with hp=1", () => {
      const world = createGameWorld();
      const entity = createShrewEntity(world, ShrewType.Green, MapType.Space);

      expect(ShrewComponent.shrewType[entity]).toBe(ShrewType.Green);
      expect(ShrewComponent.hp[entity]).toBe(1);
      expect(ShrewComponent.mapType[entity]).toBe(MapType.Space);
    });
  });

  describe("createHoleEntities", () => {
    it("should create 9 holes with correct grid positions", () => {
      const world = createGameWorld();
      const holes = createHoleEntities(world, MapType.Meadow);

      expect(holes.length).toBe(HOLE_COUNT);

      // Verify grid mapping: index 0 → (0,0), index 4 → (1,1), index 8 → (2,2)
      expect(HoleComponent.gridRow[holes[0]]).toBe(0);
      expect(HoleComponent.gridCol[holes[0]]).toBe(0);

      expect(HoleComponent.gridRow[holes[4]]).toBe(1);
      expect(HoleComponent.gridCol[holes[4]]).toBe(1);

      expect(HoleComponent.gridRow[holes[8]]).toBe(2);
      expect(HoleComponent.gridCol[holes[8]]).toBe(2);
    });

    it("should set zOrder based on row", () => {
      const world = createGameWorld();
      const holes = createHoleEntities(world, MapType.Meadow);

      // row 0 → zOrder 2, row 1 → zOrder 4, row 2 → zOrder 6
      expect(HoleComponent.zIndex[holes[0]]).toBe(2);
      expect(HoleComponent.zIndex[holes[3]]).toBe(4);
      expect(HoleComponent.zIndex[holes[6]]).toBe(6);
    });

    it("should set position ratios from HolePositions config", () => {
      const world = createGameWorld();
      const holes = createHoleEntities(world, MapType.Meadow);

      expect(HoleComponent.posXRatio[holes[0]]).toBeCloseTo(HolePositions[MapType.Meadow].xRatios[0], 3);
      // Laya 使用 Y-down 坐标，旧 Cocos 0.56 对应 Laya 0.44。
      expect(HoleComponent.posYRatio[holes[0]]).toBeCloseTo(HolePositions[MapType.Meadow].yRatios[0], 2);
    });
  });

  describe("createSingletonEntities", () => {
    it("should create hammer singleton with default wood hammer", () => {
      const world = createGameWorld();
      const singletons = createSingletonEntities(world);

      expect(HammerComponent.selectedType[singletons.hammer]).toBe(HammerType.Wood);
      expect(HammerComponent.isThunderActive[singletons.hammer]).toBe(0);
      expect(HammerComponent.hitTable[singletons.hammer]).toBe(1);
      expect(HammerComponent.hitCooldownSec[singletons.hammer]).toBe(0);
    });

    it("should create scene singleton with Meadow map", () => {
      const world = createGameWorld();
      const singletons = createSingletonEntities(world);

      expect(SceneComponent.currentMap[singletons.scene]).toBe(MapType.Meadow);
      expect(SceneComponent.cycleInterval[singletons.scene]).toBe(SCENE_CYCLE_INTERVAL);
    });

    it("should create player singleton with zero values", () => {
      const world = createGameWorld();
      const singletons = createSingletonEntities(world);

      expect(PlayerComponent.money[singletons.player]).toBe(0);
      expect(PlayerComponent.angry[singletons.player]).toBe(0);
      expect(PlayerComponent.power[singletons.player]).toBe(0);
    });

    it("should create network singleton", () => {
      const world = createGameWorld();
      const singletons = createSingletonEntities(world);

      expect(NetworkComponent.connected[singletons.network]).toBe(0);
      expect(NetworkComponent.pendingKick[singletons.network]).toBe(0);
    });
  });
});
