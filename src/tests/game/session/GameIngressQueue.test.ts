import { beforeEach, describe, expect, it } from "vitest";
import { HammerType } from "../../../game/features/hammer";
import { PlayerComponent } from "../../../game/features/playerHud/PlayerComponents";
import { createGameIngressQueue } from "../../../game/session/GameIngressQueue";
import { createGameWorld } from "../../../framework/ecs/GameWorld";
import { createEffectRuntime } from "../../../framework/sync/EffectRuntime";
import type { KickResponse } from "../../../network/ProtocolTypes";
import { createSingletonEntities } from "../../helpers/SingletonTestEntities";

describe("GameIngressQueue", () => {
  let world: ReturnType<typeof createGameWorld>;
  let player: number;

  beforeEach(() => {
    world = createGameWorld();
    player = createSingletonEntities(world).player;
  });

  it("delays a network response until ingress drains it", () => {
    const queue = createGameIngressQueue();
    const effects = createEffectRuntime();
    queue.enqueueKickResponse(kickResponse());

    expect(PlayerComponent.money[player]).toBe(0);

    queue.drain(world, effects);

    expect(PlayerComponent.money[player]).toBe(100);
  });

  it("drops queued network facts when the scene is cleared", () => {
    const queue = createGameIngressQueue();
    const effects = createEffectRuntime();
    queue.enqueueKickResponse(kickResponse());
    queue.clear();

    queue.drain(world, effects);

    expect(PlayerComponent.money[player]).toBe(0);
  });
});

function kickResponse(): KickResponse {
  return {
    seqId: 1,
    cmd: "kickResult",
    ret: 0,
    money: 100,
    angry: 0,
    power: 0,
    levelScore: 0,
    hammerId: HammerType.Wood,
    numOfShrew: 0,
    shrewResp: [],
    combo: 0,
    comboId: 0,
  };
}
