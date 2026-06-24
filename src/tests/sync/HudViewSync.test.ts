import { addComponent, addEntity } from "bitecs";
import { describe, expect, it } from "vitest";
import { createViewSyncRuntime } from "../../binding/ViewSyncRuntime";
import { HitViewSync, PlayerViewSync } from "../../binding/viewSyncs";
import { HitComponent, PlayerComponent } from "../../ecs/components";
import { createGameWorld, createSingletonEntities } from "../../ecs/world";
import {
  BIT_HIT_INDEX,
  BIT_HIT_REWARD,
  BIT_HIT_WASHIT,
  BIT_PLAYER_ANGRY,
  BIT_PLAYER_LEVEL,
  BIT_PLAYER_MONEY,
  BIT_PLAYER_POWER,
} from "../../sync/DirtyFlags";
import type { IHitEffectNode } from "../../sync/contracts/HitViewContract";
import type { IPlayerHUD } from "../../sync/contracts/PlayerViewContract";

describe("HUD view sync", () => {
  it("projects player HUD values", () => {
    const world = createGameWorld();
    const { player } = createSingletonEntities(world);
    const calls = {
      money: [] as number[],
      angry: [] as number[],
      power: [] as Array<{ value: number; max: number }>,
      level: [] as number[],
    };
    const node: IPlayerHUD = {
      setMoney: (value) => calls.money.push(value),
      setAngry: (value) => calls.angry.push(value),
      setPower: (value, max) => calls.power.push({ value, max }),
      setLevel: (value) => calls.level.push(value),
    };
    const runtime = createViewSyncRuntime([PlayerViewSync]);
    runtime.registryFor(PlayerViewSync).register(player, node);

    PlayerComponent.money[player] = 100;
    PlayerComponent.angry[player] = 50;
    PlayerComponent.power[player] = 5;
    PlayerComponent.powerTop[player] = 10;
    PlayerComponent.level[player] = 2;
    runtime.channelFor(PlayerViewSync).project(
      player,
      BIT_PLAYER_MONEY | BIT_PLAYER_ANGRY | BIT_PLAYER_POWER | BIT_PLAYER_LEVEL,
      false,
    );

    expect(calls).toEqual({
      money: [100],
      angry: [50],
      power: [{ value: 5, max: 10 }],
      level: [2],
    });
  });

  it("deduplicates hit fields into one reward projection", () => {
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
    const runtime = createViewSyncRuntime([HitViewSync]);
    runtime.registryFor(HitViewSync).register(eid, node);

    HitComponent.shrewIndex[eid] = 4;
    HitComponent.reward[eid] = 80;
    HitComponent.wasHit[eid] = 1;
    runtime.channelFor(HitViewSync).project(
      eid,
      BIT_HIT_INDEX | BIT_HIT_REWARD | BIT_HIT_WASHIT,
      false,
    );

    expect(calls).toEqual({
      rewards: [{ shrewIndex: 4, reward: 80 }],
      misses: 0,
    });
  });
});
