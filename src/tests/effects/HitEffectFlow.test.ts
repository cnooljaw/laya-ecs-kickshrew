import { describe, expect, it } from "vitest";
import { HammerEntity } from "../../ecs/gameplay/hammer/HammerEntity";
import { PlayerEntity } from "../../ecs/gameplay/hud/PlayerEntity";
import { createEntityRuntime } from "../../framework/ecs/EntityRuntime";
import { HammerType } from "../../ecs/types";
import { createGameWorld } from "../../ecs/world";
import { createEffectRuntime } from "../../framework/sync/EffectRuntime";
import { HitRewardEffect } from "../../effects/HitEffects";
import { routeKickResponse } from "../../view/KickResponseAdapter";

describe("hit effect flow", () => {
  it("emits successful rewards once during flush", () => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, [HammerEntity, PlayerEntity]);
    entities.bootstrapSingletons();
    const effects = createEffectRuntime();
    const shown: Array<{ shrewIndex: number; reward: number }> = [];
    effects.on(HitRewardEffect, payload => shown.push(payload));

    routeKickResponse(world, effects, {
      seqId: 1,
      cmd: "kickResult",
      ret: 0,
      money: 50,
      angry: 0,
      power: 0,
      levelScore: 1,
      hammerId: HammerType.Wood,
      numOfShrew: 1,
      shrewResp: [{ shrewIndex: 1, reward: 50 }],
      combo: 0,
      comboId: 0,
    });

    expect(shown).toEqual([]);
    effects.flush();
    expect(shown).toEqual([{ shrewIndex: 1, reward: 50 }]);
    effects.flush();
    expect(shown).toHaveLength(1);
  });
});
