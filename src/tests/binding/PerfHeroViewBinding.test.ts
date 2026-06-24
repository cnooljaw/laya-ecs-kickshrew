import { describe, expect, it } from "vitest";
import type { IPerfHeroNode } from "../../sync/contracts/PerfHeroViewContract";
import { createGameWorld, createPerfHeroEntities } from "../../ecs/world";
import { DirtyComponent, PerfHeroComponent } from "../../ecs/components";
import { dirtyMarkSystem } from "../../sync/dirty/DirtyMarkSystem";
import { SyncView } from "../../binding/SyncView";
import { createViewSyncRuntime } from "../../binding/ViewSyncRuntime";
import { PerfHeroViewSync } from "../../binding/viewSyncs";
import { BIT_PERF_HERO_SPAWN } from "../../sync/DirtyFlags";
import { PERF_HERO_RESOURCES } from "../../config/ViewLayoutConfig";

describe("PerfHeroViewBinding", () => {
  it("英雄重生时通过 dirty binding 通知节点播放对应 Spine", () => {
    const world = createGameWorld();
    const [eid] = createPerfHeroEntities(world, 1);
    const plays: Array<{ heroType: number; skUrl: string; x: number; y: number; scale: number; spawnSeq: number }> = [];
    const node: IPerfHeroNode = {
      playHero: (heroType, skUrl, x, y, scale, spawnSeq) => {
        plays.push({ heroType, skUrl, x, y, scale, spawnSeq });
      },
    };
    const runtime = createViewSyncRuntime([PerfHeroViewSync]);
    runtime.registryFor(PerfHeroViewSync).register(eid, node);

    const syncView = new SyncView();
    syncView.registerChannels(runtime.channels());

    dirtyMarkSystem(world, [PerfHeroViewSync.dirtyAspect]);
    syncView.sync(world);
    plays.length = 0;

    PerfHeroComponent.heroType[eid] = 1;
    PerfHeroComponent.spawnSeq[eid] += 1;
    dirtyMarkSystem(world, [PerfHeroViewSync.dirtyAspect]);

    expect(DirtyComponent.perfHeroDirty[eid] & BIT_PERF_HERO_SPAWN).toBeTruthy();

    syncView.sync(world);

    expect(plays).toEqual([
      {
        heroType: 1,
        skUrl: PERF_HERO_RESOURCES[1].skUrl,
        x: PerfHeroComponent.posX[eid],
        y: PerfHeroComponent.posY[eid],
        scale: PerfHeroComponent.scale[eid],
        spawnSeq: PerfHeroComponent.spawnSeq[eid],
      },
    ]);
  });
});
