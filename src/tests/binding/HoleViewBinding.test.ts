import { afterEach, describe, expect, it } from "vitest";
import type { IHoleNode } from "../../sync/contracts/HoleViewContract";
import { createGameWorld, createHoleEntities } from "../../ecs/world";
import { HoleComponent } from "../../ecs/components";
import {
  holeViewBinding,
  registerHoleNode,
  unregisterHoleNode,
} from "../../binding/HoleViewBinding";
import { BIT_HOLE_POS, BIT_HOLE_SHREW, BIT_HOLE_ZORDER } from "../../sync/DirtyFlags";
import { MapType } from "../../ecs/types";

describe("HoleViewBinding", () => {
  const registered: number[] = [];

  afterEach(() => {
    for (const eid of registered) {
      unregisterHoleNode(eid);
    }
    registered.length = 0;
  });

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
    registerHoleNode(eid, node);
    registered.push(eid);

    HoleComponent.posXRatio[eid] = 0.25;
    HoleComponent.posYRatio[eid] = 0.5;
    HoleComponent.shrewEid[eid] = 7;
    HoleComponent.zIndex[eid] = 3;

    holeViewBinding(eid, BIT_HOLE_POS | BIT_HOLE_SHREW | BIT_HOLE_ZORDER, false);

    expect(calls.positions).toEqual([{ x: 0.25, y: 0.5 }]);
    expect(calls.shrews).toEqual([7]);
    expect(calls.zOrders).toEqual([3]);
  });
});
