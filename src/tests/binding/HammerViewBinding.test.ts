import { describe, expect, it } from "vitest";
import type { IHammerNode } from "../../sync/contracts/HammerViewContract";
import { createGameWorld, createSingletonEntities } from "../../ecs/world";
import { HammerComponent } from "../../ecs/components";
import { createViewSyncRuntime } from "../../binding/ViewSyncRuntime";
import { HammerViewSync } from "../../binding/viewSyncs";
import {
  BIT_HAMMER_HIT_FEEDBACK,
  BIT_HAMMER_HITTABLE,
  BIT_HAMMER_THUNDER,
  BIT_HAMMER_TYPE,
} from "../../sync/DirtyFlags";

describe("HammerViewBinding", () => {
  it("首次 force full sync 不会播放空击动画", () => {
    const world = createGameWorld();
    const { hammer: eid } = createSingletonEntities(world);
    const hits: number[] = [];
    const node: IHammerNode = {
      setHammerType: () => {},
      setThunderActive: () => {},
      followTouch: () => {},
      playHitAnimation: () => { hits.push(1); },
    };
    const runtime = createViewSyncRuntime([HammerViewSync]);
    runtime.registryFor(HammerViewSync).register(eid, node);

    runtime.channelFor(HammerViewSync).project(eid, 0, true);

    expect(hits).toEqual([]);
  });

  it("表格式规则投影锤子类型、雷神状态和击打反馈，hitTable 只参与 dirty", () => {
    const world = createGameWorld();
    const { hammer: eid } = createSingletonEntities(world);
    const calls = {
      types: [] as number[],
      thunder: [] as boolean[],
      positions: [] as Array<[number, number]>,
      hits: 0,
    };
    const node: IHammerNode = {
      setHammerType: hammerType => calls.types.push(hammerType),
      setThunderActive: active => calls.thunder.push(active),
      followTouch: (x, y) => calls.positions.push([x, y]),
      playHitAnimation: () => { calls.hits += 1; },
    };
    const runtime = createViewSyncRuntime([HammerViewSync]);
    runtime.registryFor(HammerViewSync).register(eid, node);

    HammerComponent.selectedType[eid] = 4;
    HammerComponent.isThunderActive[eid] = 1;
    HammerComponent.hitTable[eid] = 0;
    HammerComponent.touchX[eid] = 123;
    HammerComponent.touchY[eid] = 456;
    HammerComponent.hitSeq[eid] = 1;

    runtime.channelFor(HammerViewSync).project(
      eid,
      BIT_HAMMER_TYPE | BIT_HAMMER_THUNDER | BIT_HAMMER_HITTABLE | BIT_HAMMER_HIT_FEEDBACK,
      false,
    );

    expect(calls.types).toEqual([4]);
    expect(calls.thunder).toEqual([true]);
    expect(calls.positions).toEqual([[123, 456]]);
    expect(calls.hits).toBe(1);
  });
});
