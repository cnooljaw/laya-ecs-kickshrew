import { describe, expect, it } from "vitest";
import { PlayerComponent } from "../../ecs/components";
import { PlayerEntity } from "../../ecs/gameplay/hud/PlayerEntity";
import { createEntityRuntime } from "../../framework/ecs/EntityRuntime";
import { createGameWorld } from "../../ecs/world";
import type { IPlayerHUD } from "../../sync/contracts/PlayerViewContract";
import { createProjectionRuntime } from "../../framework/sync/ProjectionRuntime";
import { PlayerProjection } from "../../sync/projections/HudProjection";

describe("HUD projection", () => {
  it("projects player values and deduplicates power fields", () => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, [PlayerEntity]);
    entities.bootstrapSingletons();
    const player = entities.one(PlayerEntity);
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
    const runtime = createProjectionRuntime([PlayerProjection]);
    runtime.mount(PlayerProjection, player, node);
    runtime.mark(world);
    runtime.sync(world);
    Object.values(calls).forEach(values => { values.length = 0; });

    PlayerComponent.money[player] = 100;
    PlayerComponent.angry[player] = 50;
    PlayerComponent.power[player] = 5;
    PlayerComponent.powerTop[player] = 10;
    PlayerComponent.level[player] = 2;
    runtime.mark(world);
    runtime.sync(world);

    expect(calls).toEqual({
      money: [100],
      angry: [50],
      power: [{ value: 5, max: 10 }],
      level: [2],
    });
  });
});
