import { hasComponent } from "bitecs";
import { describe, expect, it } from "vitest";
import { HolePositions } from "../../config/HolePositions";
import { SCENE_CYCLE_INTERVAL } from "../../config/SceneConfig";
import {
  AnimationComponent,
  DirtyComponent,
  HammerComponent,
  HoleComponent,
  NetworkComponent,
  PlayerComponent,
  SceneComponent,
  ShrewComponent,
} from "../../ecs/components";
import { HammerType, HOLE_COUNT, MapType, ShrewAction, ShrewType } from "../../ecs/types";
import {
  createGameWorld,
  createHoleEntities,
  createShrewEntity,
  createSingletonEntities,
} from "../../ecs/world";

describe("world factory", () => {
  it("uses integer arrays for dirty bitmasks and full-sync flags", () => {
    expect(DirtyComponent.shrewDirty).toBeInstanceOf(Uint32Array);
    expect(DirtyComponent.animDirty).toBeInstanceOf(Uint32Array);
    expect(DirtyComponent.monsterDirty).toBeInstanceOf(Uint32Array);
    expect(DirtyComponent.forceFullSync).toBeInstanceOf(Uint8Array);
  });

  it.each([
    { type: ShrewType.Red, map: MapType.Meadow, hp: 1, hasHat: 0 },
    { type: ShrewType.Blue, map: MapType.Meadow, hp: 2, hasHat: 1 },
    { type: ShrewType.Yellow, map: MapType.Ship, hp: 1, hasHat: 0 },
    { type: ShrewType.Green, map: MapType.Space, hp: 1, hasHat: 0 },
  ])("creates $type shrew with its gameplay defaults", ({ type, map, hp, hasHat }) => {
    const world = createGameWorld();
    const entity = createShrewEntity(world, type, map);

    expect(hasComponent(world, ShrewComponent, entity)).toBe(true);
    expect(hasComponent(world, AnimationComponent, entity)).toBe(true);
    expect(hasComponent(world, DirtyComponent, entity)).toBe(true);
    expect(ShrewComponent.shrewType[entity]).toBe(type);
    expect(ShrewComponent.mapType[entity]).toBe(map);
    expect(ShrewComponent.hp[entity]).toBe(hp);
    expect(ShrewComponent.hasHat[entity]).toBe(hasHat);
    expect(ShrewComponent.actionState[entity]).toBe(ShrewAction.Wait);
    expect(ShrewComponent.animTimer[entity]).toBeGreaterThanOrEqual(1);
    expect(ShrewComponent.animTimer[entity]).toBeLessThanOrEqual(8);
    expect(ShrewComponent.isClickable[entity]).toBe(0);
    expect(DirtyComponent.forceFullSync[entity]).toBe(0);
  });

  it("creates the configured 3x3 hole layout", () => {
    const world = createGameWorld();
    const holes = createHoleEntities(world, MapType.Meadow);

    expect(holes).toHaveLength(HOLE_COUNT);
    expect(holes.map((eid) => [HoleComponent.gridRow[eid], HoleComponent.gridCol[eid]])).toEqual([
      [0, 0], [0, 1], [0, 2],
      [1, 0], [1, 1], [1, 2],
      [2, 0], [2, 1], [2, 2],
    ]);
    expect(holes.map((eid) => HoleComponent.zIndex[eid])).toEqual([2, 2, 2, 4, 4, 4, 6, 6, 6]);

    holes.forEach((eid, index) => {
      expect(HoleComponent.posXRatio[eid]).toBeCloseTo(HolePositions[MapType.Meadow].xRatios[index], 5);
      expect(HoleComponent.posYRatio[eid]).toBeCloseTo(HolePositions[MapType.Meadow].yRatios[index], 5);
      expect(HoleComponent.shrewEid[eid]).toBe(0);
      expect(hasComponent(world, DirtyComponent, eid)).toBe(true);
    });
  });

  it("creates singleton entities with complete defaults", () => {
    const world = createGameWorld();
    const { hammer, scene, player, network } = createSingletonEntities(world);

    expect({
      selectedType: HammerComponent.selectedType[hammer],
      isThunderActive: HammerComponent.isThunderActive[hammer],
      hitTable: HammerComponent.hitTable[hammer],
      hitCooldownSec: HammerComponent.hitCooldownSec[hammer],
      touchX: HammerComponent.touchX[hammer],
      touchY: HammerComponent.touchY[hammer],
      hitSeq: HammerComponent.hitSeq[hammer],
    }).toEqual({
      selectedType: HammerType.Wood,
      isThunderActive: 0,
      hitTable: 1,
      hitCooldownSec: 0,
      touchX: 0,
      touchY: 0,
      hitSeq: 0,
    });
    expect({
      currentMap: SceneComponent.currentMap[scene],
      sceneTimer: SceneComponent.sceneTimer[scene],
      cycleInterval: SceneComponent.cycleInterval[scene],
      transitioning: SceneComponent.transitioning[scene],
    }).toEqual({
      currentMap: MapType.Meadow,
      sceneTimer: 0,
      cycleInterval: SCENE_CYCLE_INTERVAL,
      transitioning: 0,
    });
    expect({
      money: PlayerComponent.money[player],
      angry: PlayerComponent.angry[player],
      power: PlayerComponent.power[player],
      powerTop: PlayerComponent.powerTop[player],
      level: PlayerComponent.level[player],
    }).toEqual({
      money: 0,
      angry: 0,
      power: 0,
      powerTop: 0,
      level: 0,
    });
    expect({
      connected: NetworkComponent.connected[network],
      pendingKick: NetworkComponent.pendingKick[network],
    }).toEqual({
      connected: 0,
      pendingKick: 0,
    });
  });
});
