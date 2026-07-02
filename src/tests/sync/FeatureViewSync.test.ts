import { describe, expect, it } from "vitest";
import { MonsterComponent } from "../../game/features/monster";
import { MonsterEntity } from "../../game/features/monster";
import { MonsterAction, MonsterType } from "../../game/features/monster";
import { BoardPositionComponent } from "../../game/board";
import { PerfHeroComponent } from "../../game/features/perfHero";
import { PerfHeroEntity } from "../../game/features/perfHero";
import { createEntityRuntime } from "../../framework/ecs/EntityRuntime";
import { createGameWorld } from "../../framework/ecs/GameWorld";
import type { IMonsterNode } from "../../game/features/monster/IMonsterNode";
import type { IPerfHeroNode } from "../../game/features/perfHero/IPerfHeroNode";
import { MonsterProjection } from "../../game/features/monster";
import { PerfHeroProjection } from "../../game/features/perfHero";
import { createProjectionRuntime } from "../../framework/sync/ProjectionRuntime";

describe("feature projections", () => {
  it("projects monster identity, transform and visibility without resource URLs", () => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, [MonsterEntity]);
    const monster = entities.create(MonsterEntity, {
      monsterType: MonsterType.Rhino,
      posX: 480,
      posY: 352,
      durationSec: 10,
    });
    const calls = {
      spawns: [] as Array<{ monsterType: number; spawnSeq: number }>,
      positions: [] as Array<[number, number]>,
      hits: [] as number[],
      defeated: [] as number[],
      animations: [] as Array<[number, number]>,
      zOrders: [] as number[],
      visible: [] as boolean[],
    };
    const node: IMonsterNode = {
      playDefeated: seq => calls.defeated.push(seq),
      playHit: seq => calls.hits.push(seq),
      spawn: (monsterType, spawnSeq) => calls.spawns.push({ monsterType, spawnSeq }),
      setAnimation: (action, progress) => calls.animations.push([action, progress]),
      setPosition: (x, y) => calls.positions.push([x, y]),
      setZOrder: z => calls.zOrders.push(z),
      setVisible: visible => calls.visible.push(visible),
    };
    const runtime = createProjectionRuntime([MonsterProjection]);
    runtime.mount(MonsterProjection, monster, node);

    MonsterComponent.visible[monster] = 1;
    MonsterComponent.actionState[monster] = MonsterAction.Drop;
    MonsterComponent.animationProgress[monster] = 0.5;
    MonsterComponent.spawnSeq[monster] = 1;
    MonsterComponent.hitSeq[monster] = 1;
    MonsterComponent.defeatedSeq[monster] = 1;
    BoardPositionComponent.xRatio[monster] = 0.5;
    BoardPositionComponent.yRatio[monster] = 0.6;
    BoardPositionComponent.zIndex[monster] = 80;
    runtime.mark(world);
    runtime.sync(world);

    expect(calls.spawns).toEqual([{ monsterType: MonsterType.Rhino, spawnSeq: 1 }]);
    expect(calls.positions).toHaveLength(1);
    expect(calls.positions[0][0]).toBeCloseTo(0.5, 5);
    expect(calls.positions[0][1]).toBeCloseTo(0.6, 5);
    expect(calls.hits).toEqual([1]);
    expect(calls.defeated).toEqual([1]);
    expect(calls.animations).toEqual([[MonsterAction.Drop, 0.5]]);
    expect(calls.zOrders).toEqual([80]);
    expect(calls.visible).toEqual([true]);
  });

  it("deduplicates perf hero transform rows and projects respawn identity", () => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, [PerfHeroEntity]);
    const hero = entities.create(PerfHeroEntity, 0);
    const calls = {
      plays: [] as Array<{ heroType: number; spawnSeq: number }>,
      transforms: [] as Array<[number, number, number]>,
    };
    const node: IPerfHeroNode = {
      playHero: (heroType, spawnSeq) => calls.plays.push({ heroType, spawnSeq }),
      setTransform: (x, y, scale) => calls.transforms.push([x, y, scale]),
    };
    const runtime = createProjectionRuntime([PerfHeroProjection]);
    runtime.mount(PerfHeroProjection, hero, node);
    runtime.mark(world);
    runtime.sync(world);
    calls.plays.length = 0;
    calls.transforms.length = 0;

    PerfHeroComponent.posX[hero] += 1;
    PerfHeroComponent.posY[hero] += 2;
    PerfHeroComponent.scale[hero] += 0.1;
    PerfHeroComponent.spawnSeq[hero] += 1;
    runtime.mark(world);
    runtime.sync(world);

    expect(calls.plays).toEqual([{
      heroType: PerfHeroComponent.heroType[hero],
      spawnSeq: PerfHeroComponent.spawnSeq[hero],
    }]);
    expect(calls.transforms).toEqual([[
      PerfHeroComponent.posX[hero],
      PerfHeroComponent.posY[hero],
      PerfHeroComponent.scale[hero],
    ]]);
  });
});
