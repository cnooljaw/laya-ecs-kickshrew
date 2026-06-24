import { describe, expect, it } from "vitest";
import { SyncView } from "../../binding/SyncView";
import { createViewSyncRuntime } from "../../binding/ViewSyncRuntime";
import { MonsterViewSync, PerfHeroViewSync } from "../../binding/viewSyncs";
import { MONSTER_CONFIG } from "../../config/MonsterConfig";
import { PERF_HERO_RESOURCES } from "../../config/ViewLayoutConfig";
import { DirtyComponent, PerfHeroComponent } from "../../ecs/components";
import { MonsterComponent } from "../../ecs/gameplay/monster/MonsterComponent";
import { createMonsterEntities } from "../../ecs/gameplay/monster/MonsterFactory";
import { MonsterType } from "../../ecs/gameplay/monster/MonsterTypes";
import { createGameWorld, createPerfHeroEntities } from "../../ecs/world";
import {
  BIT_MONSTER_SHOW,
  BIT_MONSTER_SPAWN,
  BIT_PERF_HERO_SPAWN,
} from "../../sync/DirtyFlags";
import type { IMonsterNode } from "../../sync/contracts/MonsterViewContract";
import type { IPerfHeroNode } from "../../sync/contracts/PerfHeroViewContract";
import { dirtyMarkSystem } from "../../sync/dirty/DirtyMarkSystem";

describe("feature view sync", () => {
  it("projects monster spawn and visibility", () => {
    const world = createGameWorld();
    const [eid] = createMonsterEntities(world, { count: 1 });
    const calls = {
      monsters: [] as Array<{ monsterType: number; skUrl: string; pngUrl: string; spawnSeq: number }>,
      visible: [] as boolean[],
    };
    const node: IMonsterNode = {
      playMonster: (monsterType, skUrl, pngUrl, spawnSeq) => {
        calls.monsters.push({ monsterType, skUrl, pngUrl, spawnSeq });
      },
      setPosition: () => {},
      setScale: () => {},
      setVisible: (visible) => calls.visible.push(visible),
    };
    const runtime = createViewSyncRuntime([MonsterViewSync]);
    runtime.registryFor(MonsterViewSync).register(eid, node);

    MonsterComponent.monsterType[eid] = MonsterType.Rhino;
    MonsterComponent.visible[eid] = 1;
    MonsterComponent.spawnSeq[eid] = 1;
    runtime.channelFor(MonsterViewSync).project(
      eid,
      BIT_MONSTER_SPAWN | BIT_MONSTER_SHOW,
      false,
    );

    expect(calls).toEqual({
      monsters: [{
        monsterType: MonsterType.Rhino,
        skUrl: MONSTER_CONFIG[MonsterType.Rhino].skUrl,
        pngUrl: MONSTER_CONFIG[MonsterType.Rhino].pngUrl,
        spawnSeq: 1,
      }],
      visible: [true],
    });
  });

  it("connects monster dirty marking to SyncView", () => {
    const world = createGameWorld();
    const [eid] = createMonsterEntities(world, { count: 1 });
    const visible: boolean[] = [];
    const node: IMonsterNode = {
      playMonster: () => {},
      setPosition: () => {},
      setScale: () => {},
      setVisible: (value) => visible.push(value),
    };
    const runtime = createViewSyncRuntime([MonsterViewSync]);
    runtime.registryFor(MonsterViewSync).register(eid, node);
    const syncView = new SyncView();
    syncView.registerChannels(runtime.channels());

    dirtyMarkSystem(world, [MonsterViewSync.dirtyAspect]);
    syncView.sync(world);
    visible.length = 0;
    MonsterComponent.visible[eid] = 1;
    dirtyMarkSystem(world, [MonsterViewSync.dirtyAspect]);
    syncView.sync(world);

    expect(visible).toEqual([true]);
    expect(DirtyComponent.monsterDirty[eid]).toBe(0);
  });

  it("projects perf hero respawn data", () => {
    const world = createGameWorld();
    const [eid] = createPerfHeroEntities(world, 1);
    const plays: Array<{
      heroType: number;
      skUrl: string;
      x: number;
      y: number;
      scale: number;
      spawnSeq: number;
    }> = [];
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

    expect(plays).toEqual([{
      heroType: 1,
      skUrl: PERF_HERO_RESOURCES[1].skUrl,
      x: PerfHeroComponent.posX[eid],
      y: PerfHeroComponent.posY[eid],
      scale: PerfHeroComponent.scale[eid],
      spawnSeq: PerfHeroComponent.spawnSeq[eid],
    }]);
  });
});
