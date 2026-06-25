import { defineQuery } from "bitecs";
import { beforeEach, describe, expect, it } from "vitest";
import { HAMMER_RULES } from "../../config/GameTuning";
import { HammerComponent, PlayerComponent } from "../../ecs/components";
import { HammerEntity } from "../../ecs/gameplay/hammer/HammerEntity";
import { hammerSystem } from "../../ecs/gameplay/hammer/HammerSystem";
import { createEntityRuntime } from "../../ecs/runtime/EntityRuntime";
import { HammerType } from "../../ecs/types";
import { createGameWorld, createSingletonEntities } from "../../ecs/world";

describe("HammerSystem", () => {
  let world: ReturnType<typeof createGameWorld>;
  let singletons: ReturnType<typeof createSingletonEntities>;

  beforeEach(() => {
    world = createGameWorld();
    singletons = createSingletonEntities(world);
  });

  it("bootstraps one hammer entity with complete defaults", () => {
    const runtimeWorld = createGameWorld();
    const runtime = createEntityRuntime(runtimeWorld, [HammerEntity]);
    runtime.bootstrapSingletons();
    const hammer = runtime.one(HammerEntity);

    expect({
      selectedType: HammerComponent.selectedType[hammer],
      isThunderActive: HammerComponent.isThunderActive[hammer],
      hitTable: HammerComponent.hitTable[hammer],
      hitCooldownSec: HammerComponent.hitCooldownSec[hammer],
      touchX: HammerComponent.touchX[hammer],
      touchY: HammerComponent.touchY[hammer],
      hitSeq: HammerComponent.hitSeq[hammer],
    }).toEqual({
      selectedType: HammerType.Wood,
      isThunderActive: 0,
      hitTable: 1,
      hitCooldownSec: 0,
      touchX: 0,
      touchY: 0,
      hitSeq: 0,
    });
  });

  it("reuses the runtime hammer when creating legacy singleton references", () => {
    const runtimeWorld = createGameWorld();
    const runtime = createEntityRuntime(runtimeWorld, [HammerEntity]);
    runtime.bootstrapSingletons();
    const hammer = runtime.one(HammerEntity);

    const refs = createSingletonEntities(runtimeWorld, { hammer });

    expect(refs.hammer).toBe(hammer);
    expect(Array.from(defineQuery([HammerComponent])(runtimeWorld))).toEqual([hammer]);
  });

  it("switches the selected hammer outside thunder mode", () => {
    hammerSystem(world, HammerType.Gold);

    expect(HammerComponent.selectedType[singletons.hammer]).toBe(HammerType.Gold);
  });

  it.each([
    { angry: HAMMER_RULES.thunderAngryThreshold - 1, active: 0 },
    { angry: HAMMER_RULES.thunderAngryThreshold, active: 1 },
    { angry: HAMMER_RULES.thunderAngryThreshold + 1, active: 1 },
  ])("applies the thunder threshold at angry=$angry", ({ angry, active }) => {
    PlayerComponent.angry[singletons.player] = angry;

    hammerSystem(world);

    expect(HammerComponent.isThunderActive[singletons.hammer]).toBe(active);
    expect(HammerComponent.selectedType[singletons.hammer]).toBe(
      active === 1 ? HammerType.Thunder : HammerType.Wood,
    );
    expect(HammerComponent.hitTable[singletons.hammer]).toBe(active === 1 ? 0 : 1);
  });

  it("restores the normal hammer after the thunder animation", () => {
    PlayerComponent.angry[singletons.player] = HAMMER_RULES.thunderAngryThreshold;
    hammerSystem(world);

    hammerSystem(world, undefined, true);

    expect(HammerComponent.isThunderActive[singletons.hammer]).toBe(0);
    expect(HammerComponent.selectedType[singletons.hammer]).toBe(HammerType.Gold);
    expect(HammerComponent.hitTable[singletons.hammer]).toBe(1);
    expect(HammerComponent.hitCooldownSec[singletons.hammer]).toBe(0);
  });

  it("restores hitTable immediately when the hit animation completes", () => {
    HammerComponent.hitTable[singletons.hammer] = 0;
    HammerComponent.hitCooldownSec[singletons.hammer] = 0.24;

    hammerSystem(world, undefined, false, true);

    expect(HammerComponent.hitTable[singletons.hammer]).toBe(1);
    expect(HammerComponent.hitCooldownSec[singletons.hammer]).toBe(0);
  });

  it("restores hitTable when the ordinary hit cooldown expires", () => {
    HammerComponent.hitTable[singletons.hammer] = 0;
    HammerComponent.hitCooldownSec[singletons.hammer] = 0.24;

    hammerSystem(world, undefined, false, false, 0.12);
    expect(HammerComponent.hitTable[singletons.hammer]).toBe(0);
    expect(HammerComponent.hitCooldownSec[singletons.hammer]).toBeCloseTo(0.12, 3);

    hammerSystem(world, undefined, false, false, 0.12);
    expect(HammerComponent.hitTable[singletons.hammer]).toBe(1);
    expect(HammerComponent.hitCooldownSec[singletons.hammer]).toBe(0);
  });
});
