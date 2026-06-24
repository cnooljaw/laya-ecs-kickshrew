import { describe, expect, it } from "vitest";
import { DirtyComponent } from "../../ecs/components";
import { createGameWorld } from "../../ecs/world";
import { dirtyMarkSystem } from "../../sync/dirty/DirtyMarkSystem";
import { SyncView } from "../../binding/SyncView";
import { createMonsterEntities } from "../../ecs/gameplay/monster/MonsterFactory";
import { MonsterComponent } from "../../ecs/gameplay/monster/MonsterComponent";
import { MonsterType } from "../../ecs/gameplay/monster/MonsterTypes";
import { MONSTER_CONFIG } from "../../config/MonsterConfig";
import { createViewSyncRuntime } from "../../binding/ViewSyncRuntime";
import { MonsterViewSync } from "../../binding/viewSyncs";
import type { IMonsterNode } from "../../sync/contracts/MonsterViewContract";
import { BIT_MONSTER_SHOW, BIT_MONSTER_SPAWN } from "../../sync/DirtyFlags";

describe("MonsterViewBinding", () => {
  it("Rhino 生成和显隐 dirty 会投影到 MonsterNode contract", () => {
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
      setVisible: visible => {
        calls.visible.push(visible);
      },
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

    expect(calls.monsters).toEqual([
      {
        monsterType: MonsterType.Rhino,
        skUrl: MONSTER_CONFIG[MonsterType.Rhino].skUrl,
        pngUrl: MONSTER_CONFIG[MonsterType.Rhino].pngUrl,
        spawnSeq: 1,
      },
    ]);
    expect(calls.visible).toEqual([true]);
  });

  it("Monster rules 可以接入通用 dirtyMarkSystem 和 SyncView channel", () => {
    const world = createGameWorld();
    const [eid] = createMonsterEntities(world, { count: 1 });
    const visible: boolean[] = [];
    const node: IMonsterNode = {
      playMonster: () => {},
      setPosition: () => {},
      setScale: () => {},
      setVisible: value => visible.push(value),
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

    expect(DirtyComponent.monsterDirty[eid] & BIT_MONSTER_SHOW).toBeTruthy();

    syncView.sync(world);

    expect(visible).toEqual([true]);
    expect(DirtyComponent.monsterDirty[eid]).toBe(0);
  });
});
