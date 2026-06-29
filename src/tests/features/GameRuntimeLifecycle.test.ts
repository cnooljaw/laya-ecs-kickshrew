import { deleteWorld } from "bitecs";
import { describe, expect, it } from "vitest";
import { ShrewEntity } from "../../game/features/shrew";
import { createEntityRuntime } from "../../framework/ecs/EntityRuntime";
import { MapType, ShrewType } from "../../game/features/shrew";
import { createGameWorld } from "../../framework/ecs/World";
import type { IShrewNode } from "../../game/features/shrew";
import { createProjectionRuntime } from "../../framework/sync/ProjectionRuntime";
import { ShrewProjection } from "../../game/features/shrew";

function createNode(onSprite: () => void): IShrewNode {
  return {
    setSpriteFrame: onSprite,
    setAnimation: () => {},
    setClickable: () => {},
    setHatVisible: () => {},
    setPropType: () => {},
  };
}

describe("Game runtime lifecycle", () => {
  it("clears the old world runtime and rebuilds independent snapshots on re-entry", () => {
    const oldWorld = createGameWorld();
    const oldEntities = createEntityRuntime(oldWorld, [ShrewEntity]);
    const oldEid = oldEntities.create(ShrewEntity, {
      shrewType: ShrewType.Red,
      mapType: MapType.Meadow,
    });
    const oldProjection = createProjectionRuntime([ShrewProjection]);
    let oldSyncs = 0;
    oldProjection.mount(ShrewProjection, oldEid, createNode(() => { oldSyncs += 1; }));
    oldProjection.mark(oldWorld);
    oldProjection.sync(oldWorld);
    expect(oldSyncs).toBe(1);

    oldProjection.clear();
    oldEntities.clear();
    deleteWorld(oldWorld);
    expect(oldProjection.projections()).toEqual([]);

    const newWorld = createGameWorld();
    const newEntities = createEntityRuntime(newWorld, [ShrewEntity]);
    const newEid = newEntities.create(ShrewEntity, {
      shrewType: ShrewType.Blue,
      mapType: MapType.Ship,
    });
    const newProjection = createProjectionRuntime([ShrewProjection]);
    let newSyncs = 0;
    newProjection.mount(ShrewProjection, newEid, createNode(() => { newSyncs += 1; }));
    newProjection.mark(newWorld);
    newProjection.sync(newWorld);

    expect(newSyncs).toBe(1);
    newProjection.clear();
    newEntities.clear();
    deleteWorld(newWorld);
  });
});
