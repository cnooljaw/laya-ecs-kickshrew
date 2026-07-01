import { describe, expect, it } from "vitest";
import { createGameWorld } from "../../../../framework/ecs/GameWorld";
import { createEntityRuntime } from "../../../../framework/ecs/EntityRuntime";
import {
  BoardOccupantKind,
  HoleComponent,
  HoleEntity,
  MapType,
} from "../../../../game/features/board";
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
});
