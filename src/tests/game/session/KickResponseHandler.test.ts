import { beforeEach, describe, expect, it } from "vitest";
import { HAMMER_RULES } from "../../../config/GameTuning";
import { HammerComponent } from "../../../game/features/hammer/assembly";
import { PlayerComponent } from "../../../game/features/playerHud/assembly";
import {
  applyKickResponse,
  type KickResponse,
} from "../../../game/session";
import { HammerType } from "../../../game/features/hammer/assembly";
import { createGameWorld } from "../../../framework/ecs/GameWorld";
import { createSingletonEntities } from "../../helpers/SingletonTestEntities";

describe("KickResponseHandler", () => {
  let world: ReturnType<typeof createGameWorld>;
  let singletons: ReturnType<typeof createSingletonEntities>;

  beforeEach(() => {
    world = createGameWorld();
    singletons = createSingletonEntities(world);
  });

  const makeResponse = (overrides: Partial<KickResponse> = {}): KickResponse => ({
    seqId: 1,
    cmd: "kickResult",
    ret: 0,
    money: 100,
    angry: 50,
    power: 10,
    levelScore: 200,
    hammerId: HammerType.Wood,
    numOfShrew: 1,
    shrewResp: [{ shrewIndex: 0, reward: 50 }],
    combo: 0,
    comboId: 0,
    ...overrides,
  });

  it("applies a successful response to player, hammer and rewards", () => {
    PlayerComponent.money[singletons.player] = 20;
    PlayerComponent.power[singletons.player] = 3;
    const response = makeResponse({
      money: 100,
      angry: 50,
      power: 10,
      levelScore: 200,
      hammerId: HammerType.Gold,
      numOfShrew: 2,
      shrewResp: [
        { shrewIndex: 0, reward: 50 },
        { shrewIndex: 4, reward: 100 },
      ],
    });

    const rewards = applyKickResponse(world, response);

    expect({
      money: PlayerComponent.money[singletons.player],
      angry: PlayerComponent.angry[singletons.player],
      power: PlayerComponent.power[singletons.player],
      level: PlayerComponent.level[singletons.player],
      hammer: HammerComponent.selectedType[singletons.hammer],
      rewards,
    }).toEqual({
      money: 120,
      angry: 50,
      power: 13,
      level: 200,
      hammer: HammerType.Gold,
      rewards: response.shrewResp,
    });
  });

  it.each([
    { angry: HAMMER_RULES.thunderAngryThreshold - 1, active: 0 },
    { angry: HAMMER_RULES.thunderAngryThreshold, active: 1 },
    { angry: HAMMER_RULES.thunderAngryThreshold + 1, active: 1 },
  ])("applies the thunder threshold at angry=$angry", ({ angry, active }) => {
    applyKickResponse(world, makeResponse({ angry, hammerId: HammerType.Wood }));

    expect(HammerComponent.isThunderActive[singletons.hammer]).toBe(active);
    expect(HammerComponent.selectedType[singletons.hammer]).toBe(
      active === 1 ? HammerType.Thunder : HammerType.Wood,
    );
  });

  it("rejects an error response without changing authoritative state", () => {
    PlayerComponent.money[singletons.player] = 50;
    PlayerComponent.angry[singletons.player] = 10;
    PlayerComponent.power[singletons.player] = 3;
    PlayerComponent.level[singletons.player] = 20;
    const before = {
      money: PlayerComponent.money[singletons.player],
      angry: PlayerComponent.angry[singletons.player],
      power: PlayerComponent.power[singletons.player],
      level: PlayerComponent.level[singletons.player],
      hammer: HammerComponent.selectedType[singletons.hammer],
    };

    const rewards = applyKickResponse(world, makeResponse({
      ret: -1,
      money: 999,
      angry: 999,
      power: 999,
      levelScore: 999,
      hammerId: HammerType.Thunder,
    }));

    expect(rewards).toEqual([]);
    expect({
      money: PlayerComponent.money[singletons.player],
      angry: PlayerComponent.angry[singletons.player],
      power: PlayerComponent.power[singletons.player],
      level: PlayerComponent.level[singletons.player],
      hammer: HammerComponent.selectedType[singletons.hammer],
    }).toEqual(before);
  });

  it("logs score deltas after applying the response", () => {
    const events: Array<{ event: string; payload: Record<string, unknown> }> = [];

    applyKickResponse(world, makeResponse({ money: 120, power: 3, levelScore: 450 }), {
      log: (event, payload) => events.push({ event, payload }),
    });

    expect(events).toEqual([
      {
        event: "score.applied",
        payload: expect.objectContaining({
          seqId: 1,
          moneyBefore: 0,
          moneyDelta: 120,
          moneyAfter: 120,
          powerBefore: 0,
          powerDelta: 3,
          powerAfter: 3,
          levelBefore: 0,
          levelAfter: 450,
        }),
      },
    ]);
  });
});
