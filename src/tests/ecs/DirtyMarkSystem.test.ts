import { addComponent, addEntity } from "bitecs";
import { beforeEach, describe, expect, it } from "vitest";
import {
  DirtyComponent,
  HitComponent,
  PlayerComponent,
} from "../../ecs/components";
import { createGameWorld, createSingletonEntities } from "../../ecs/world";
import { GAME_FEATURE_REGISTRY } from "../../features/GameFeatures";
import {
  BIT_HIT_INDEX,
  BIT_HIT_REWARD,
  BIT_HIT_WASHIT,
  BIT_PLAYER_ANGRY,
  BIT_PLAYER_LEVEL,
  BIT_PLAYER_MONEY,
  BIT_PLAYER_POWER,
} from "../../sync/DirtyFlags";
import { dirtyMarkSystem } from "../../sync/dirty/DirtyMarkSystem";

describe("DirtyMarkSystem", () => {
  let world: ReturnType<typeof createGameWorld>;

  beforeEach(() => {
    world = createGameWorld();
  });

  function markDirty(): void {
    dirtyMarkSystem(world, GAME_FEATURE_REGISTRY.dirtyAspects());
  }

  it("combines player field changes", () => {
    const { player } = createSingletonEntities(world);
    markDirty();

    PlayerComponent.money[player] = 100;
    PlayerComponent.angry[player] = 50;
    PlayerComponent.power[player] = 10;
    PlayerComponent.powerTop[player] = 100;
    PlayerComponent.level[player] = 2;
    markDirty();

    expect(DirtyComponent.playerDirty[player]).toBe(
      BIT_PLAYER_MONEY | BIT_PLAYER_ANGRY | BIT_PLAYER_POWER | BIT_PLAYER_LEVEL,
    );
  });

  it("combines hit result changes", () => {
    const eid = addEntity(world);
    addComponent(world, HitComponent, eid);
    addComponent(world, DirtyComponent, eid);
    markDirty();

    HitComponent.shrewIndex[eid] = 3;
    HitComponent.reward[eid] = 50;
    HitComponent.wasHit[eid] = 1;
    markDirty();

    expect(DirtyComponent.hitDirty[eid]).toBe(BIT_HIT_INDEX | BIT_HIT_REWARD | BIT_HIT_WASHIT);
  });
});
