import { afterEach, describe, expect, it } from "vitest";
import { createGameWorld, createPerfHeroEntities } from "../../ecs/world";
import { DirtyComponent, PerfHeroComponent } from "../../ecs/components";
import { dirtyMarkSystem } from "../../ecs/systems/DirtyMarkSystem";
import { SyncView } from "../../binding/SyncView";
import {
  perfHeroViewBinding,
  registerPerfHeroNode,
  unregisterPerfHeroNode,
  type IPerfHeroNode,
} from "../../binding/PerfHeroViewBinding";
import { BIT_PERF_HERO_SPAWN } from "../../sync/DirtyFlags";
import { PERF_HERO_RESOURCES } from "../../config/ViewLayoutConfig";

describe("PerfHeroViewBinding", () => {
  const registered: number[] = [];

  afterEach(() => {
    for (const eid of registered) {
      unregisterPerfHeroNode(eid);
    }
    registered.length = 0;
  });

  it("英雄重生时通过 dirty binding 通知节点播放对应 Spine", () => {
    const world = createGameWorld();
    const [eid] = createPerfHeroEntities(world, 1);
    const plays: Array<{ heroType: number; skUrl: string; x: number; y: number; scale: number; spawnSeq: number }> = [];
    const node: IPerfHeroNode = {
      playHero: (heroType, skUrl, x, y, scale, spawnSeq) => {
        plays.push({ heroType, skUrl, x, y, scale, spawnSeq });
      },
    };
    registerPerfHeroNode(eid, node);
    registered.push(eid);

    const syncView = new SyncView();
    syncView.registerPerfHeroBinding(perfHeroViewBinding);

    dirtyMarkSystem(world);
    syncView.sync(world);
    plays.length = 0;

    PerfHeroComponent.heroType[eid] = 1;
    PerfHeroComponent.spawnSeq[eid] += 1;
    dirtyMarkSystem(world);

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
