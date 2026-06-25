import { describe, expect, it } from "vitest";
import { MonsterComponent } from "../../ecs/gameplay/monster/MonsterComponent";
import { MonsterEntity } from "../../ecs/gameplay/monster/MonsterEntity";
import { MonsterType } from "../../ecs/gameplay/monster/MonsterTypes";
import { PerfHeroComponent } from "../../ecs/components";
import { PerfHeroEntity } from "../../ecs/gameplay/perfHero/PerfHeroEntity";
import { createEntityRuntime } from "../../ecs/runtime/EntityRuntime";
import { createGameWorld } from "../../ecs/world";
import type { IMonsterNode } from "../../sync/contracts/MonsterViewContract";
import type { IPerfHeroNode } from "../../sync/contracts/PerfHeroViewContract";
import { MonsterProjection } from "../../sync/projections/MonsterProjection";
import { PerfHeroProjection } from "../../sync/projections/PerfHeroProjection";
import { createProjectionRuntime } from "../../sync/projection/ProjectionRuntime";

describe("feature projections", () => {
  it("projects monster identity, transform and visibility without resource URLs", () => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, [MonsterEntity]);
    const monster = entities.create(MonsterEntity, MonsterType.Rhino);
    const calls = {
      spawns: [] as Array<{ monsterType: number; spawnSeq: number }>,
      positions: [] as Array<[number, number]>,
      scales: [] as number[],
      visible: [] as boolean[],
    };
    const node: IMonsterNode = {
      spawn: (monsterType, spawnSeq) => calls.spawns.push({ monsterType, spawnSeq }),
      setPosition: (x, y) => calls.positions.push([x, y]),
      setScale: scale => calls.scales.push(scale),
      setVisible: visible => calls.visible.push(visible),
    };
    const runtime = createProjectionRuntime([MonsterProjection]);
    runtime.mount(MonsterProjection, monster, node);

    MonsterComponent.visible[monster] = 1;
    MonsterComponent.spawnSeq[monster] = 1;
    runtime.mark(world);
    runtime.sync(world);

    expect(calls.spawns).toEqual([{ monsterType: MonsterType.Rhino, spawnSeq: 1 }]);
    expect(calls.positions).toEqual([[MonsterComponent.posX[monster], MonsterComponent.posY[monster]]]);
    expect(calls.scales).toEqual([MonsterComponent.scale[monster]]);
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
