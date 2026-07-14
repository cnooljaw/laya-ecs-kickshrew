import { beforeEach, describe, expect, it } from "vitest";
import { createGameWorld } from "../../../../framework/ecs/GameWorld";
import { createHoleEntities, createShrewEntity, bindShrewToHoleForTest } from "../../../helpers/CoreTestEntities";
import { MapType } from "../../../../game/board";
import { ShrewAction, ShrewType } from "../../../../game/features/shrew";
import { applyServerGameSnapshot, syncServerShrewState } from "../../../../game/features/shrew/ShrewServerSync";
import { ShrewComponent } from "../../../../game/features/shrew/ShrewComponents";
import { resetServerGameClock } from "../../../../game/features/shrew/ServerGameClock";

describe("ShrewServerSync", () => {
  beforeEach(() => {
    resetServerGameClock();
  });

  it("按服务端绝对时间推导 Stand 和 Down，不依赖本地随机倒计时", () => {
    const world = createGameWorld();
    const [hole] = createHoleEntities(world, MapType.Meadow);
    const shrew = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    bindShrewToHoleForTest(hole, shrew);

    applyServerGameSnapshot(world, {
      serverTimeMs: 350,
      attackId: 1,
      attackEpoch: 1,
      timelineRev: 7,
      defaultTiming: { waitMs: 100, upMs: 100, standMs: 200, downMs: 100, dizzyMs: 50 },
      activeCycles: [{
        holeIndex: 1,
        spawnSeq: 42,
        shrewType: ShrewType.Blue,
        protectType: 0,
        hp: 2,
        waitStartMs: 100,
        upStartMs: 200,
        standStartMs: 300,
        downStartMs: 500,
        endMs: 600,
      }],
    });

    syncServerShrewState(shrew, 350);
    expect(ShrewComponent.serverControlled[shrew]).toBe(1);
    expect(ShrewComponent.spawnSeq[shrew]).toBe(42);
    expect(ShrewComponent.shrewType[shrew]).toBe(ShrewType.Blue);
    expect(ShrewComponent.actionState[shrew]).toBe(ShrewAction.Stand);
    expect(ShrewComponent.isClickable[shrew]).toBe(1);

    syncServerShrewState(shrew, 550);
    expect(ShrewComponent.actionState[shrew]).toBe(ShrewAction.Down);
    expect(ShrewComponent.isClickable[shrew]).toBe(0);

    ShrewComponent.hp[shrew] = 0;
    syncServerShrewState(shrew, 550);
    expect(ShrewComponent.actionState[shrew]).toBe(ShrewAction.Dizzy);
  });
});
