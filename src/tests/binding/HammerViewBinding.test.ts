import { afterEach, describe, expect, it } from "vitest";
import { createGameWorld, createSingletonEntities } from "../../ecs/world";
import { HammerComponent } from "../../ecs/components";
import {
  hammerViewBinding,
  registerHammerNode,
  unregisterHammerNode,
  type IHammerNode,
} from "../../binding/HammerViewBinding";
import { BIT_HAMMER_HITTABLE, BIT_HAMMER_THUNDER, BIT_HAMMER_TYPE } from "../../sync/DirtyFlags";

describe("HammerViewBinding", () => {
  const registered: number[] = [];

  afterEach(() => {
    for (const eid of registered) {
      unregisterHammerNode(eid);
    }
    registered.length = 0;
  });

  it("表格式规则投影锤子类型和雷神状态，hitTable 只参与 dirty 不触发 view", () => {
    const world = createGameWorld();
    const { hammer: eid } = createSingletonEntities(world);
    const calls = {
      types: [] as number[],
      thunder: [] as boolean[],
      hits: 0,
    };
    const node: IHammerNode = {
      setHammerType: hammerType => calls.types.push(hammerType),
      setThunderActive: active => calls.thunder.push(active),
      playHitAnimation: () => { calls.hits += 1; },
    };
    registerHammerNode(eid, node);
    registered.push(eid);

    HammerComponent.selectedType[eid] = 4;
    HammerComponent.isThunderActive[eid] = 1;
    HammerComponent.hitTable[eid] = 0;

    hammerViewBinding(eid, BIT_HAMMER_TYPE | BIT_HAMMER_THUNDER | BIT_HAMMER_HITTABLE, false);

    expect(calls.types).toEqual([4]);
    expect(calls.thunder).toEqual([true]);
    expect(calls.hits).toBe(0);
  });
});
