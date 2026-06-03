import { afterEach, describe, expect, it } from "vitest";
import { createGameWorld, createPerfLadybirdEntities } from "../../ecs/world";
import { DirtyComponent, PerfLadybirdComponent } from "../../ecs/components";
import { dirtyMarkSystem } from "../../ecs/systems/DirtyMarkSystem";
import { SyncView } from "../../binding/SyncView";
import {
  perfLadybirdViewBinding,
  registerPerfLadybirdNode,
  unregisterPerfLadybirdNode,
  type IPerfLadybirdNode,
} from "../../binding/PerfLadybirdViewBinding";
import { BIT_PERF_LADYBIRD_POS } from "../../binding/DirtyFlags";

describe("PerfLadybirdViewBinding", () => {
  const registered: number[] = [];

  afterEach(() => {
    for (const eid of registered) {
      unregisterPerfLadybirdNode(eid);
    }
    registered.length = 0;
  });

  it("PerfLadybirdComponent 位置变化通过 dirty binding 同步到节点", () => {
    const world = createGameWorld();
    const [eid] = createPerfLadybirdEntities(world, 1);
    const transforms: Array<{ x: number; y: number; scale: number; phase: number }> = [];
    const node: IPerfLadybirdNode = {
      setTransform: (x, y, scale, phase) => {
        transforms.push({ x, y, scale, phase });
      },
    };
    registerPerfLadybirdNode(eid, node);
    registered.push(eid);

    const syncView = new SyncView();
    syncView.registerPerfLadybirdBinding(perfLadybirdViewBinding);

    dirtyMarkSystem(world);
    syncView.sync(world);
    transforms.length = 0;

    PerfLadybirdComponent.posX[eid] += 3;
    PerfLadybirdComponent.posY[eid] += 2;
    PerfLadybirdComponent.phase[eid] += 0.25;
    dirtyMarkSystem(world);

    expect(DirtyComponent.perfLadybirdDirty[eid] & BIT_PERF_LADYBIRD_POS).toBeTruthy();

    syncView.sync(world);

    expect(transforms).toEqual([
      {
        x: PerfLadybirdComponent.posX[eid],
        y: PerfLadybirdComponent.posY[eid],
        scale: PerfLadybirdComponent.scale[eid],
        phase: PerfLadybirdComponent.phase[eid],
      },
    ]);
  });
});
