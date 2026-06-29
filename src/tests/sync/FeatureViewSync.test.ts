import { describe, expect, it } from "vitest";
import { MonsterComponent } from "../../game/features/monster";
import { MonsterEntity } from "../../game/features/monster";
import { MonsterType } from "../../game/features/monster";
import { PerfHeroComponent } from "../../game/features/perfHero";
import { PerfHeroEntity } from "../../game/features/perfHero";
import { createEntityRuntime } from "../../framework/ecs/EntityRuntime";
import { createGameWorld } from "../../framework/ecs/World";
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
      scale: 1,
      durationSec: 10,
    });
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
