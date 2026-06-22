import { describe, expect, it } from "vitest";
import { createGameWorld, createSingletonEntities } from "../../../../ecs/world";
import { PlayerComponent } from "../../../../ecs/components";
import { MonsterComponent, MonsterSpawnComponent } from "../../../../ecs/gameplay/monster/MonsterComponent";
import { MonsterType } from "../../../../ecs/gameplay/monster/MonsterTypes";
import {
  createMonsterEntities,
  createMonsterEntitiesForRules,
  createMonsterSpawnState,
} from "../../../../ecs/gameplay/monster/MonsterFactory";
import { monsterLifetimeSystem, monsterSpawnSystem } from "../../../../ecs/gameplay/monster/MonsterSystem";

describe("MonsterSystem", () => {
  it("玩家金币跨过 100 倍数时生成一次 Rhino，重复帧不重复生成", () => {
    const world = createGameWorld();
    const { player } = createSingletonEntities(world);
    const spawnState = createMonsterSpawnState(world);
    const [monster] = createMonsterEntities(world, { count: 1 });

    PlayerComponent.money[player] = 99;
    monsterSpawnSystem(world);

    expect(MonsterComponent.visible[monster]).toBe(0);
    expect(MonsterSpawnComponent.lastTriggeredMilestone0[spawnState]).toBe(0);

    PlayerComponent.money[player] = 100;
    monsterSpawnSystem(world);

    expect(MonsterComponent.visible[monster]).toBe(1);
    expect(MonsterComponent.monsterType[monster]).toBe(MonsterType.Rhino);
    expect(MonsterComponent.durationSec[monster]).toBe(10);
    expect(MonsterComponent.spawnSeq[monster]).toBe(1);
    expect(MonsterSpawnComponent.lastTriggeredMilestone0[spawnState]).toBe(1);

    monsterSpawnSystem(world);

    expect(MonsterComponent.spawnSeq[monster]).toBe(1);
    expect(MonsterSpawnComponent.lastTriggeredMilestone0[spawnState]).toBe(1);
  });

  it("隐藏策略下 Rhino 出现 10 秒后只设置 visible=0，不删除实体", () => {
    const world = createGameWorld();
    createSingletonEntities(world);
    const [monster] = createMonsterEntities(world, { count: 1 });

    MonsterComponent.monsterType[monster] = MonsterType.Rhino;
    MonsterComponent.visible[monster] = 1;
    MonsterComponent.ageSec[monster] = 9.5;
    MonsterComponent.durationSec[monster] = 10;

    monsterLifetimeSystem(world, 0.4);
    expect(MonsterComponent.visible[monster]).toBe(1);

    monsterLifetimeSystem(world, 0.2);
    expect(MonsterComponent.visible[monster]).toBe(0);
    expect(MonsterComponent.ageSec[monster]).toBe(10);
  });

  it("一次跨过多个 100 倍数时默认只生成一次，并消费到最新里程碑", () => {
    const world = createGameWorld();
    const { player } = createSingletonEntities(world);
    const spawnState = createMonsterSpawnState(world);
    const [monster] = createMonsterEntities(world, { count: 1 });

    PlayerComponent.money[player] = 350;
    monsterSpawnSystem(world);

    expect(MonsterComponent.visible[monster]).toBe(1);
    expect(MonsterComponent.spawnSeq[monster]).toBe(1);
    expect(MonsterSpawnComponent.lastTriggeredMilestone0[spawnState]).toBe(3);
  });

  it("达到新 100 倍数时如果 Rhino 仍在场，则丢弃这次触发且隐藏后不补发", () => {
    const world = createGameWorld();
    const { player } = createSingletonEntities(world);
    const spawnState = createMonsterSpawnState(world);
    const [monster] = createMonsterEntities(world, { count: 1 });

    PlayerComponent.money[player] = 100;
    monsterSpawnSystem(world);

    expect(MonsterComponent.visible[monster]).toBe(1);
    expect(MonsterComponent.spawnSeq[monster]).toBe(1);
    expect(MonsterSpawnComponent.lastTriggeredMilestone0[spawnState]).toBe(1);

    PlayerComponent.money[player] = 200;
    monsterSpawnSystem(world);

    expect(MonsterComponent.visible[monster]).toBe(1);
    expect(MonsterComponent.spawnSeq[monster]).toBe(1);
    expect(MonsterSpawnComponent.lastTriggeredMilestone0[spawnState]).toBe(2);

    MonsterComponent.visible[monster] = 0;
    monsterSpawnSystem(world);

    expect(MonsterComponent.visible[monster]).toBe(0);
    expect(MonsterComponent.spawnSeq[monster]).toBe(1);
    expect(MonsterSpawnComponent.lastTriggeredMilestone0[spawnState]).toBe(2);
  });

  it("按规则合计创建怪物槽位，避免多个触发规则只拿到最大值数量", () => {
    const world = createGameWorld();
    const entities = createMonsterEntitiesForRules(world, [
      {
        slot: 0,
        monsterType: MonsterType.Rhino,
        maxActiveCount: 1,
        trigger: { source: "money", mode: "multiple", interval: 100, catchUp: false },
      },
      {
        slot: 1,
        monsterType: MonsterType.Rhino,
        maxActiveCount: 2,
        trigger: { source: "money", mode: "multiple", interval: 500, catchUp: false },
      },
    ]);

    expect(entities).toHaveLength(3);
    expect(entities.map(eid => MonsterComponent.monsterType[eid])).toEqual([
      MonsterType.Rhino,
      MonsterType.Rhino,
      MonsterType.Rhino,
    ]);
  });
});
