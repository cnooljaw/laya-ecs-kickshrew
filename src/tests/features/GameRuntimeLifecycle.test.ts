import { deleteWorld } from "bitecs";
import { describe, expect, it } from "vitest";
import { ShrewViewSync } from "../../binding/viewSyncs";
import { createGameWorld, createShrewEntity } from "../../ecs/world";
import { MapType, ShrewType } from "../../ecs/types";
import {
  dirtyMarkSystem,
  getDirtySnapshotForTest,
  releaseDirtyWorld,
} from "../../sync/dirty/DirtyMarkSystem";

describe("Game runtime lifecycle", () => {
  it("退出旧 world 时释放其 snapshots，新 world 独立重新建立", () => {
    const oldWorld = createGameWorld();
    const oldEid = createShrewEntity(oldWorld, ShrewType.Red, MapType.Meadow);
    dirtyMarkSystem(oldWorld, [ShrewViewSync.dirtyAspect]);
    expect(getDirtySnapshotForTest(oldWorld, "shrew", oldEid)).toBeTruthy();

    releaseDirtyWorld(oldWorld);
    deleteWorld(oldWorld);

    const newWorld = createGameWorld();
    const newEid = createShrewEntity(newWorld, ShrewType.Blue, MapType.Ship);
    expect(getDirtySnapshotForTest(newWorld, "shrew", newEid)).toBeUndefined();

    dirtyMarkSystem(newWorld, [ShrewViewSync.dirtyAspect]);

    expect(getDirtySnapshotForTest(newWorld, "shrew", newEid)).toBeTruthy();
    releaseDirtyWorld(newWorld);
    deleteWorld(newWorld);
  });
});
