import { describe, expect, it } from "vitest";
import { createGameWorld } from "../../../../framework/ecs/GameWorld";
import { createEntityRuntime } from "../../../../framework/ecs/EntityRuntime";
import {
  BoardOccupantKind,
  HOLE_COUNT,
  HoleComponent,
  HoleEntity,
  MapType,
  SCENE_CYCLE_INTERVAL,
  SceneComponent,
  SceneEntity,
  mapCycleSystem,
} from "../../../../game/board";
import {
  ShrewAction,
  ShrewComponent,
  ShrewEntity,
  ShrewType,
  shrewBoardSyncSystem,
} from "../../../../game/features/shrew";

describe("ShrewBoardSyncSystem", () => {
  it("洞被 Monster 占用时隐藏该洞默认 Shrew 并禁用点击", () => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, [HoleEntity, ShrewEntity]);
    const hole = entities.create(HoleEntity, { index: 4, mapType: MapType.Meadow });
    const shrew = entities.create(ShrewEntity, {
      shrewType: ShrewType.Red,
      mapType: MapType.Meadow,
      holeIndex: 4,
    });

    HoleComponent.residentKind[hole] = BoardOccupantKind.Shrew;
    HoleComponent.residentEid[hole] = shrew;
    HoleComponent.occupantKind[hole] = BoardOccupantKind.Monster;
    HoleComponent.occupantEid[hole] = 999;
    ShrewComponent.actionState[shrew] = ShrewAction.Stand;
    ShrewComponent.isClickable[shrew] = 1;

    shrewBoardSyncSystem(world);

    expect(ShrewComponent.actionState[shrew]).toBe(ShrewAction.Wait);
    expect(ShrewComponent.isClickable[shrew]).toBe(0);
    expect(ShrewComponent.blockedByOccupant[shrew]).toBe(1);
  });

  it("地图切换后仍按 Monster 当前占用保持 Shrew 互斥", () => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, [SceneEntity, HoleEntity, ShrewEntity]);
    entities.bootstrapSingletons();
    const scene = entities.one(SceneEntity);
    const holes = entities.createMany(
      HoleEntity,
      Array.from({ length: HOLE_COUNT }, (_, index) => ({
        index,
        mapType: MapType.Meadow,
      })),
    );
    const shrew = entities.create(ShrewEntity, {
      shrewType: ShrewType.Red,
      mapType: MapType.Meadow,
      holeIndex: 1,
    });
    const monsterEid = 999;

    for (const holeIndex of [0, 1, 3]) {
      const hole = holes[holeIndex];
      HoleComponent.residentKind[hole] = BoardOccupantKind.Shrew;
      HoleComponent.residentEid[hole] = holeIndex === 1 ? shrew : 1000 + holeIndex;
      HoleComponent.occupantKind[hole] = BoardOccupantKind.Monster;
      HoleComponent.occupantEid[hole] = monsterEid;
    }
    ShrewComponent.actionState[shrew] = ShrewAction.Stand;
    ShrewComponent.isClickable[shrew] = 1;

    SceneComponent.sceneTimer[scene] = SCENE_CYCLE_INTERVAL;
    mapCycleSystem(world);
    shrewBoardSyncSystem(world);

    expect(SceneComponent.currentMap[scene]).toBe(MapType.Ship);
    expect(HoleComponent.occupantKind[holes[1]]).toBe(BoardOccupantKind.Monster);
    expect(HoleComponent.occupantEid[holes[1]]).toBe(monsterEid);
    expect(ShrewComponent.actionState[shrew]).toBe(ShrewAction.Wait);
    expect(ShrewComponent.isClickable[shrew]).toBe(0);
    expect(ShrewComponent.blockedByOccupant[shrew]).toBe(1);
  });
});
