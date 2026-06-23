import { afterEach, describe, expect, it } from "vitest";
import { DirtyComponent } from "../../ecs/components";
import { createGameWorld } from "../../ecs/world";
import { dirtyMarkSystem } from "../../sync/dirty/DirtyMarkSystem";
import { SyncView } from "../../binding/SyncView";
import { createMonsterEntities } from "../../ecs/gameplay/monster/MonsterFactory";
import { MonsterComponent } from "../../ecs/gameplay/monster/MonsterComponent";
import { MonsterType } from "../../ecs/gameplay/monster/MonsterTypes";
import { MONSTER_CONFIG } from "../../config/MonsterConfig";
import { MonsterDirtyAspect } from "../../sync/dirty/aspects/MonsterDirtyAspect";
import { MONSTER_SYNC_RULES } from "../../sync/rules/MonsterSyncRules";
import { monsterRegistry, monsterViewBinding } from "../../binding/MonsterViewBinding";
import type { IMonsterNode } from "../../sync/contracts/MonsterViewContract";
import { BIT_MONSTER_SHOW, BIT_MONSTER_SPAWN } from "../../sync/DirtyFlags";

describe("MonsterViewBinding", () => {
  const registered: number[] = [];

  afterEach(() => {
    for (const eid of registered) {
      monsterRegistry.unregister(eid);
    }
    registered.length = 0;
  });

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
    monsterRegistry.register(eid, node);
    registered.push(eid);

    MonsterComponent.monsterType[eid] = MonsterType.Rhino;
    MonsterComponent.visible[eid] = 1;
    MonsterComponent.spawnSeq[eid] = 1;

    monsterViewBinding(eid, BIT_MONSTER_SPAWN | BIT_MONSTER_SHOW, false);

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
    monsterRegistry.register(eid, node);
    registered.push(eid);

    const syncView = new SyncView();
    syncView.registerChannel({
      name: "monster",
      dirtyTarget: "monsterDirty",
      mask: MONSTER_SYNC_RULES.reduce((bits, rule) => bits | rule.bit, 0),
      binding: monsterViewBinding,
    });

    dirtyMarkSystem(world, [MonsterDirtyAspect]);
    syncView.sync(world);
    visible.length = 0;

    MonsterComponent.visible[eid] = 1;
    dirtyMarkSystem(world, [MonsterDirtyAspect]);

    expect(DirtyComponent.monsterDirty[eid] & BIT_MONSTER_SHOW).toBeTruthy();

    syncView.sync(world);

    expect(visible).toEqual([true]);
    expect(DirtyComponent.monsterDirty[eid]).toBe(0);
  });
});
