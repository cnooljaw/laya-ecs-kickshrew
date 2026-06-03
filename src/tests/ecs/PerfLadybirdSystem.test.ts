import { describe, expect, it } from "vitest";
import { createGameWorld, createPerfLadybirdEntities } from "../../ecs/world";
import { PerfLadybirdComponent } from "../../ecs/components";
import { perfLadybirdSystem } from "../../ecs/systems/PerfLadybirdSystem";
import { PERF_LADYBIRD_VIEW_LAYOUT } from "../../config/ViewLayoutConfig";

describe("PerfLadybirdSystem", () => {
  it("创建的小瓢虫均匀分布在四个角落", () => {
    const world = createGameWorld();
    const eids = createPerfLadybirdEntities(world, 8);

    const counts = [0, 0, 0, 0];
    for (const eid of eids) {
      counts[PerfLadybirdComponent.corner[eid]]++;
    }

    expect(counts).toEqual([2, 2, 2, 2]);
  });

  it("每帧按 ECS 相位在基础位置附近小幅度抖动", () => {
    const world = createGameWorld();
    const [eid] = createPerfLadybirdEntities(world, 1);
    const baseX = PerfLadybirdComponent.baseX[eid];
    const baseY = PerfLadybirdComponent.baseY[eid];

    perfLadybirdSystem(world, 0.5);

    expect(PerfLadybirdComponent.phase[eid]).toBeGreaterThan(0);
    expect(Math.abs(PerfLadybirdComponent.posX[eid] - baseX)).toBeLessThanOrEqual(PERF_LADYBIRD_VIEW_LAYOUT.jitterRadiusX);
    expect(Math.abs(PerfLadybirdComponent.posY[eid] - baseY)).toBeLessThanOrEqual(PERF_LADYBIRD_VIEW_LAYOUT.jitterRadiusY);
  });
});
