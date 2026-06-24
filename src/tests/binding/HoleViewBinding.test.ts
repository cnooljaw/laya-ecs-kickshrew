import { describe, expect, it } from "vitest";
import type { IHoleNode } from "../../sync/contracts/HoleViewContract";
import { createGameWorld, createHoleEntities } from "../../ecs/world";
import { HoleComponent } from "../../ecs/components";
import { createViewSyncRuntime } from "../../binding/ViewSyncRuntime";
import { HoleViewSync } from "../../binding/viewSyncs";
import { BIT_HOLE_POS, BIT_HOLE_SHREW, BIT_HOLE_ZORDER } from "../../sync/DirtyFlags";
import { MapType } from "../../ecs/types";

describe("HoleViewBinding", () => {
  it("表格式规则按 hole dirty bit 投影位置、地鼠可见性和层级", () => {
    const world = createGameWorld();
    const [eid] = createHoleEntities(world, MapType.Meadow);
    const calls = {
      positions: [] as Array<{ x: number; y: number }>,
      shrews: [] as number[],
      zOrders: [] as number[],
    };
    const node: IHoleNode = {
      setPosition: (x, y) => calls.positions.push({ x, y }),
      setShrewVisible: shrewEid => calls.shrews.push(shrewEid),
      setZOrder: z => calls.zOrders.push(z),
    };
    const runtime = createViewSyncRuntime([HoleViewSync]);
    runtime.registryFor(HoleViewSync).register(eid, node);

    HoleComponent.posXRatio[eid] = 0.25;
    HoleComponent.posYRatio[eid] = 0.5;
    HoleComponent.shrewEid[eid] = 7;
    HoleComponent.zIndex[eid] = 3;

    runtime.channelFor(HoleViewSync).project(
      eid,
      BIT_HOLE_POS | BIT_HOLE_SHREW | BIT_HOLE_ZORDER,
      false,
    );

    expect(calls.positions).toEqual([{ x: 0.25, y: 0.5 }]);
    expect(calls.shrews).toEqual([7]);
    expect(calls.zOrders).toEqual([3]);
  });
});
