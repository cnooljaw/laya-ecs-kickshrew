import { afterEach, describe, expect, it } from "vitest";
import type { IHitEffectNode } from "../../sync/contracts/HitViewContract";
import { addComponent, addEntity } from "bitecs";
import { createGameWorld } from "../../ecs/world";
import { HitComponent } from "../../ecs/components";
import {
  hitViewBinding,
  registerHitEffectNode,
  unregisterHitEffectNode,
} from "../../binding/HitViewBinding";
import { BIT_HIT_INDEX, BIT_HIT_REWARD, BIT_HIT_WASHIT } from "../../sync/DirtyFlags";

describe("HitViewBinding", () => {
  const registered: number[] = [];

  afterEach(() => {
    for (const eid of registered) {
      unregisterHitEffectNode(eid);
    }
    registered.length = 0;
  });

  it("表格式规则将命中结果多个 bit 合并成一次奖励表现", () => {
    const world = createGameWorld();
    const eid = addEntity(world);
    addComponent(world, HitComponent, eid);
    const calls = {
      rewards: [] as Array<{ shrewIndex: number; reward: number }>,
      misses: 0,
    };
    const node: IHitEffectNode = {
      showReward: (shrewIndex, reward) => calls.rewards.push({ shrewIndex, reward }),
      showMiss: () => { calls.misses += 1; },
    };
    registerHitEffectNode(eid, node);
    registered.push(eid);

    HitComponent.shrewIndex[eid] = 4;
    HitComponent.reward[eid] = 80;
    HitComponent.wasHit[eid] = 1;

    hitViewBinding(eid, BIT_HIT_INDEX | BIT_HIT_REWARD | BIT_HIT_WASHIT, false);

    expect(calls.rewards).toEqual([{ shrewIndex: 4, reward: 80 }]);
    expect(calls.misses).toBe(0);
  });
});
