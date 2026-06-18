import { afterEach, describe, expect, it } from "vitest";
import { createGameWorld, createSingletonEntities } from "../../ecs/world";
import { PlayerComponent } from "../../ecs/components";
import {
  playerViewBinding,
  registerPlayerHUD,
  unregisterPlayerHUD,
  type IPlayerHUD,
} from "../../binding/PlayerViewBinding";
import { BIT_PLAYER_ANGRY, BIT_PLAYER_LEVEL, BIT_PLAYER_MONEY, BIT_PLAYER_POWER } from "../../sync/DirtyFlags";

describe("PlayerViewBinding", () => {
  const registered: number[] = [];

  afterEach(() => {
    for (const eid of registered) {
      unregisterPlayerHUD(eid);
    }
    registered.length = 0;
  });

  it("表格式规则按 player dirty bit 投影 HUD 数值", () => {
    const world = createGameWorld();
    const { player: eid } = createSingletonEntities(world);
    const calls = {
      money: [] as number[],
      angry: [] as number[],
      power: [] as Array<{ value: number; max: number }>,
      level: [] as number[],
    };
    const node: IPlayerHUD = {
      setMoney: value => calls.money.push(value),
      setAngry: value => calls.angry.push(value),
      setPower: (value, max) => calls.power.push({ value, max }),
      setLevel: value => calls.level.push(value),
    };
    registerPlayerHUD(eid, node);
    registered.push(eid);

    PlayerComponent.money[eid] = 100;
    PlayerComponent.angry[eid] = 50;
    PlayerComponent.power[eid] = 5;
    PlayerComponent.powerTop[eid] = 10;
    PlayerComponent.level[eid] = 2;

    playerViewBinding(
      eid,
      BIT_PLAYER_MONEY | BIT_PLAYER_ANGRY | BIT_PLAYER_POWER | BIT_PLAYER_LEVEL,
      false,
    );

    expect(calls.money).toEqual([100]);
    expect(calls.angry).toEqual([50]);
    expect(calls.power).toEqual([{ value: 5, max: 10 }]);
    expect(calls.level).toEqual([2]);
  });
});
