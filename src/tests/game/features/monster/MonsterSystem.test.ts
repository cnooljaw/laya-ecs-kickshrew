import { afterEach, describe, expect, it, vi } from "vitest";
import { createGameWorld } from "../../../../framework/ecs/GameWorld";
import { createSingletonEntities } from "../../../helpers/SingletonTestEntities";
import { PlayerComponent } from "../../../../game/features/playerHud";
import { MonsterComponent, MonsterSpawnComponent } from "../../../../game/features/monster/MonsterComponents";
import { MonsterAction, MonsterType } from "../../../../game/features/monster/MonsterTypes";
import { monsterLifetimeSystem, monsterSpawnSystem } from "../../../../game/features/monster/MonsterSystems";
import { createEntityRuntime } from "../../../../framework/ecs/EntityRuntime";
import {
  BoardOccupantKind,
  BoardPositionComponent,
  BoardRuntime,
  HoleComponent,
  HoleEntity,
  MapType,
} from "../../../../game/features/board";
import {
  MonsterEntity,
  MonsterTriggerEntity,
  type MonsterEntityInput,
} from "../../../../game/features/monster/MonsterEntities";
import {
  createMonsterPool,
  createMonsterTriggerEntities,
  spawnMonster,
} from "../../../../game/features/monster/MonsterPool";
import { MONSTER_HOLE_TRIADS } from "../../../../game/features/monster/MonsterHoleTriads";
import { MONSTER_TIMING } from "../../../../game/features/monster/MonsterRules";

describe("MonsterSystem", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function monsterInput(monsterType = MonsterType.Rhino): MonsterEntityInput {
    return {
      monsterType,
      posX: 480,
      posY: 352,
      scale: 1,
      durationSec: 10,
    };
  }

  function createMonsterRuntime(world: any) {
    return createEntityRuntime(world, [MonsterEntity, MonsterTriggerEntity]);
  }

  function createBoard(world: any, scene: number): BoardRuntime {
    const runtime = createEntityRuntime(world, [HoleEntity]);
    const holes = runtime.createMany(
      HoleEntity,
      Array.from({ length: 9 }, (_, index) => ({ index, mapType: MapType.Meadow })),
    );
    return new BoardRuntime(scene, holes);
  }

  it("为每条规则创建独立 tracker，不受四槽字段限制", () => {
    const world = createGameWorld();
    const runtime = createEntityRuntime(world, [MonsterEntity, MonsterTriggerEntity]);
    const rules = Array.from({ length: 5 }, (_, index) => ({
      slot: index,
      monsterType: MonsterType.Rhino,
      maxActiveCount: 1,
      trigger: { source: "money" as const, mode: "multiple" as const, interval: 100, catchUp: false },
    }));

    const trackers = createMonsterTriggerEntities(runtime, rules);
    const monsters = createMonsterPool(
      runtime,
      rules.map(rule => monsterInput(rule.monsterType)),
    );

    expect(trackers).toHaveLength(5);
    expect(trackers.map((eid) => MonsterSpawnComponent.ruleIndex[eid])).toEqual([0, 1, 2, 3, 4]);
    expect(trackers.map((eid) => MonsterSpawnComponent.lastMilestone[eid])).toEqual([0, 0, 0, 0, 0]);
    expect(monsters).toHaveLength(5);
  });

  it("玩家金币跨过 100 倍数时生成一次 Rhino，重复帧不重复生成", () => {
    const world = createGameWorld();
    const { player, scene } = createSingletonEntities(world);
    const board = createBoard(world, scene);
    const runtime = createMonsterRuntime(world);
    const spawnState = runtime.create(MonsterTriggerEntity, 0);
    const monster = runtime.create(MonsterEntity, monsterInput());

    PlayerComponent.money[player] = 99;
    monsterSpawnSystem(world);

    expect(MonsterComponent.visible[monster]).toBe(0);
    expect(MonsterSpawnComponent.lastMilestone[spawnState]).toBe(0);

    PlayerComponent.money[player] = 100;
    monsterSpawnSystem(world);

    expect(MonsterComponent.visible[monster]).toBe(1);
    expect(MonsterComponent.actionState[monster]).toBe(MonsterAction.Drop);
    expect(MonsterComponent.stateTimer[monster]).toBeGreaterThan(0);
    expect(MonsterComponent.monsterType[monster]).toBe(MonsterType.Rhino);
    expect(MonsterComponent.durationSec[monster]).toBe(10);
    expect(MonsterComponent.spawnSeq[monster]).toBe(1);
    expect(MonsterComponent.hp[monster]).toBe(3);
    const triad = [MonsterComponent.holeA[monster], MonsterComponent.holeB[monster], MonsterComponent.holeC[monster]];
    expect(MONSTER_HOLE_TRIADS.some(candidate => candidate.every((hole, index) => hole === triad[index]))).toBe(true);
    for (const holeIndex of triad) {
      expect(HoleComponent.occupantKind[board.getHoleEid(holeIndex)]).toBe(BoardOccupantKind.Monster);
      expect(HoleComponent.occupantEid[board.getHoleEid(holeIndex)]).toBe(monster);
    }
    expect(BoardPositionComponent.xRatio[monster]).toBeGreaterThan(0);
    expect(BoardPositionComponent.yRatio[monster]).toBeGreaterThan(0);
    expect(MonsterSpawnComponent.lastMilestone[spawnState]).toBe(1);

    monsterSpawnSystem(world);

    expect(MonsterComponent.spawnSeq[monster]).toBe(1);
    expect(MonsterSpawnComponent.lastMilestone[spawnState]).toBe(1);
  });

  it("从当前可用三角形中随机选择 Monster 出现位置", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999);
    const world = createGameWorld();
    const { player, scene } = createSingletonEntities(world);
    createBoard(world, scene);
    const runtime = createMonsterRuntime(world);
    runtime.create(MonsterTriggerEntity, 0);
    const monster = runtime.create(MonsterEntity, monsterInput());

    PlayerComponent.money[player] = 100;
    monsterSpawnSystem(world);

    expect([MonsterComponent.holeA[monster], MonsterComponent.holeB[monster], MonsterComponent.holeC[monster]])
      .toEqual(MONSTER_HOLE_TRIADS[MONSTER_HOLE_TRIADS.length - 1]);
  });

  it("Rhino 按 Drop -> Stay -> Wait 推进，Stay 10 秒后释放三洞但不删除实体", () => {
    const world = createGameWorld();
    const { scene } = createSingletonEntities(world);
    const board = createBoard(world, scene);
    const monster = createMonsterRuntime(world).create(MonsterEntity, monsterInput());
    const triad: readonly [number, number, number] = [1, 3, 4];
    spawnMonster(monster, MonsterType.Rhino, triad, board);

    monsterLifetimeSystem(world, MONSTER_TIMING.dropSec - 0.01);
    expect(MonsterComponent.visible[monster]).toBe(1);
    expect(MonsterComponent.actionState[monster]).toBe(MonsterAction.Drop);

    monsterLifetimeSystem(world, 0.02);
    expect(MonsterComponent.visible[monster]).toBe(1);
    expect(MonsterComponent.actionState[monster]).toBe(MonsterAction.Stay);

    monsterLifetimeSystem(world, 10);
    expect(MonsterComponent.visible[monster]).toBe(0);
    expect(MonsterComponent.actionState[monster]).toBe(MonsterAction.Wait);
    expect(MonsterComponent.ageSec[monster]).toBe(0);
    for (const holeIndex of triad) {
      expect(HoleComponent.occupantKind[board.getHoleEid(holeIndex)]).toBe(HoleComponent.residentKind[board.getHoleEid(holeIndex)]);
      expect(HoleComponent.occupantEid[board.getHoleEid(holeIndex)]).toBe(HoleComponent.residentEid[board.getHoleEid(holeIndex)]);
    }
  });

  it("一次跨过多个 100 倍数时默认只生成一次，并消费到最新里程碑", () => {
    const world = createGameWorld();
    const { player, scene } = createSingletonEntities(world);
    createBoard(world, scene);
    const runtime = createMonsterRuntime(world);
    const spawnState = runtime.create(MonsterTriggerEntity, 0);
    const monster = runtime.create(MonsterEntity, monsterInput());

    PlayerComponent.money[player] = 350;
    monsterSpawnSystem(world);

    expect(MonsterComponent.visible[monster]).toBe(1);
    expect(MonsterComponent.spawnSeq[monster]).toBe(1);
    expect(MonsterSpawnComponent.lastMilestone[spawnState]).toBe(3);
  });

  it("达到新 100 倍数时如果 Rhino 仍在场，则丢弃这次触发且隐藏后不补发", () => {
    const world = createGameWorld();
    const { player, scene } = createSingletonEntities(world);
    createBoard(world, scene);
    const runtime = createMonsterRuntime(world);
    const spawnState = runtime.create(MonsterTriggerEntity, 0);
    const monster = runtime.create(MonsterEntity, monsterInput());

    PlayerComponent.money[player] = 100;
    monsterSpawnSystem(world);

    expect(MonsterComponent.visible[monster]).toBe(1);
    expect(MonsterComponent.spawnSeq[monster]).toBe(1);
    expect(MonsterSpawnComponent.lastMilestone[spawnState]).toBe(1);

    PlayerComponent.money[player] = 200;
    monsterSpawnSystem(world);

    expect(MonsterComponent.visible[monster]).toBe(1);
    expect(MonsterComponent.spawnSeq[monster]).toBe(1);
    expect(MonsterSpawnComponent.lastMilestone[spawnState]).toBe(2);

    MonsterComponent.visible[monster] = 0;
    monsterSpawnSystem(world);

    expect(MonsterComponent.visible[monster]).toBe(0);
    expect(MonsterComponent.spawnSeq[monster]).toBe(1);
    expect(MonsterSpawnComponent.lastMilestone[spawnState]).toBe(2);
  });

  it("按规则合计创建怪物槽位，避免多个触发规则只拿到最大值数量", () => {
    const world = createGameWorld();
    const runtime = createMonsterRuntime(world);
    const entities = createMonsterPool(runtime, [
      monsterInput(),
      monsterInput(),
      monsterInput(),
    ]);

    expect(entities).toHaveLength(3);
    expect(entities.map(eid => MonsterComponent.monsterType[eid])).toEqual([
      MonsterType.Rhino,
      MonsterType.Rhino,
      MonsterType.Rhino,
    ]);
  });

  it("没有任何可用三角形时跳过本次刷怪且不挤掉现有占用", () => {
    const world = createGameWorld();
    const { player, scene } = createSingletonEntities(world);
    const board = createBoard(world, scene);
    const runtime = createMonsterRuntime(world);
    const spawnState = runtime.create(MonsterTriggerEntity, 0);
    const monster = runtime.create(MonsterEntity, monsterInput());

    for (const hole of board.holes) {
      HoleComponent.residentKind[hole] = BoardOccupantKind.Shrew;
      HoleComponent.residentEid[hole] = 1000 + HoleComponent.index[hole];
      HoleComponent.occupantKind[hole] = BoardOccupantKind.Monster;
      HoleComponent.occupantEid[hole] = 999;
    }
    PlayerComponent.money[player] = 100;

    monsterSpawnSystem(world);

    expect(MonsterComponent.visible[monster]).toBe(0);
    expect(MonsterComponent.spawnSeq[monster]).toBe(0);
    expect(MonsterSpawnComponent.lastMilestone[spawnState]).toBe(1);
    expect(board.holes.every(hole => HoleComponent.occupantEid[hole] === 999)).toBe(true);
  });
});
