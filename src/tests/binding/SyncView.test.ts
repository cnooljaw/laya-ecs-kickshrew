import { describe, expect, it } from "vitest";
import { DirtyComponent } from "../../ecs/components";
import { createGameWorld, createSingletonEntities } from "../../ecs/world";
import { SyncView } from "../../binding/SyncView";

describe("SyncView", () => {
  it("通过 channel 表分发 dirty binding，并统一清理 dirty bits", () => {
    const world = createGameWorld();
    const { scene: eid } = createSingletonEntities(world);
    const calls: Array<{ eid: number; dirtyBits: number; forceFull: boolean }> = [];
    const syncView = new SyncView();

    syncView.registerChannel({
      name: "testScene",
      dirtyTarget: "sceneDirty",
      mask: 0x04,
      binding: (boundEid, dirtyBits, forceFull) => {
        calls.push({ eid: boundEid, dirtyBits, forceFull });
      },
    });

    DirtyComponent.sceneDirty[eid] = 0x04;
    DirtyComponent.playerDirty[eid] = 0x02;

    syncView.sync(world);

    expect(calls).toEqual([{ eid, dirtyBits: 0x04, forceFull: false }]);
    expect(DirtyComponent.sceneDirty[eid]).toBe(0);
    expect(DirtyComponent.playerDirty[eid]).toBe(0);
  });

  it("forceFullSync 会触发已注册 channel，即使该 channel 没有 dirty bit", () => {
    const world = createGameWorld();
    const { scene: eid } = createSingletonEntities(world);
    const calls: Array<{ eid: number; dirtyBits: number; forceFull: boolean }> = [];
    const syncView = new SyncView();

    syncView.registerChannel({
      name: "testScene",
      dirtyTarget: "sceneDirty",
      mask: 0x04,
      binding: (boundEid, dirtyBits, forceFull) => {
        calls.push({ eid: boundEid, dirtyBits, forceFull });
      },
    });

    DirtyComponent.forceFullSync[eid] = 1;

    syncView.sync(world);

    expect(calls).toEqual([{ eid, dirtyBits: 0, forceFull: true }]);
    expect(DirtyComponent.forceFullSync[eid]).toBe(0);
  });
});
