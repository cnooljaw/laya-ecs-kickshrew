import { defineQuery } from "bitecs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createGameWorld } from "../../../../framework/ecs/GameWorld";
import {
  PerfHeroComponent,
  PerfHeroEntity,
  PERF_HERO_RESOURCES,
  PERF_HERO_VIEW_CONFIG,
  perfHeroSystem,
} from "../../../../game/features/perfHero";
import { createEntityRuntime } from "../../../../framework/ecs/EntityRuntime";

function createPerfHeroEntities(world: any, count: number): number[] {
  const runtime = createEntityRuntime(world, [PerfHeroEntity]);
  return runtime.createMany(
    PerfHeroEntity,
    Array.from({ length: Math.max(0, Math.floor(count)) }, (_, index) => index),
  );
}

describe("PerfHeroSystem", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("通过 EntityRuntime 创建稳定英雄槽位", () => {
    const world = createGameWorld();
    const runtime = createEntityRuntime(world, [PerfHeroEntity]);

    const eids = runtime.createMany(PerfHeroEntity, Array.from({ length: 8 }, (_, index) => index));

    const counts = [0, 0, 0, 0];
    for (const eid of eids) counts[PerfHeroComponent.edge[eid]]++;
    expect(counts).toEqual([2, 2, 2, 2]);
  });

  it("创建的英雄槽位均匀分布在屏幕四周", () => {
    const world = createGameWorld();
    const eids = createPerfHeroEntities(world, 8);

    const counts = [0, 0, 0, 0];
    for (const eid of eids) {
      counts[PerfHeroComponent.edge[eid]]++;
    }

    expect(counts).toEqual([2, 2, 2, 2]);
  });

  it("创建时打散初始重生计时，避免首轮英雄集中 respawn", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const world = createGameWorld();
    const eids = createPerfHeroEntities(world, 3);

    for (const eid of eids) {
      expect(PerfHeroComponent.ageSec[eid]).toBeLessThan(0);
      expect(PerfHeroComponent.ageSec[eid]).toBeGreaterThanOrEqual(-PerfHeroComponent.durationSec[eid]);
    }
  });

  it("英雄槽位播完后会重生为随机英雄并刷新位置", () => {
    const world = createGameWorld();
    const [eid] = createPerfHeroEntities(world, 1);
    const previousSpawnSeq = PerfHeroComponent.spawnSeq[eid];

    PerfHeroComponent.ageSec[eid] = PerfHeroComponent.durationSec[eid];
    perfHeroSystem(world, 1 / 60);

    expect(PerfHeroComponent.spawnSeq[eid]).toBe(previousSpawnSeq + 1);
    expect(PerfHeroComponent.ageSec[eid]).toBe(0);
    expect(PerfHeroComponent.heroType[eid]).toBeGreaterThanOrEqual(0);
    expect(PerfHeroComponent.heroType[eid]).toBeLessThan(PERF_HERO_RESOURCES.length);
    expect(isNearScreenEdge(PerfHeroComponent.posX[eid], PerfHeroComponent.posY[eid])).toBe(true);
  });

  it("长时间重生只复用初始化槽位，不增加实体数量", () => {
    const world = createGameWorld();
    const eids = createPerfHeroEntities(world, 12);
    const query = defineQuery([PerfHeroComponent]);

    for (let frame = 0; frame < 500; frame++) {
      perfHeroSystem(world, 1);
    }

    expect(Array.from(query(world))).toEqual(eids);
  });
});

function isNearScreenEdge(x: number, y: number): boolean {
  const edge = PERF_HERO_VIEW_CONFIG.edgeBandSize;
  const marginX = PERF_HERO_VIEW_CONFIG.marginX;
  const marginY = PERF_HERO_VIEW_CONFIG.marginY;
  const width = 960;
  const height = 640;
  return (
    x <= marginX + edge ||
    x >= width - marginX - edge ||
    y <= marginY + edge ||
    y >= height - marginY - edge
  );
}
