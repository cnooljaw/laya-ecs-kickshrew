import { afterEach, describe, expect, it } from "vitest";
import { createGameWorld, createSingletonEntities } from "../../ecs/world";
import { ComboComponent } from "../../ecs/components";
import {
  comboViewBinding,
  registerComboNode,
  unregisterComboNode,
  type IComboNode,
} from "../../binding/ComboViewBinding";
import { BIT_COMBO_COUNT, BIT_COMBO_ID, BIT_COMBO_TARGETS } from "../../sync/DirtyFlags";

describe("ComboViewBinding", () => {
  const registered: number[] = [];

  afterEach(() => {
    for (const eid of registered) {
      unregisterComboNode(eid);
    }
    registered.length = 0;
  });

  it("表格式规则将连击次数和目标洞位合并成一次 showCombo 投影", () => {
    const world = createGameWorld();
    const { combo: eid } = createSingletonEntities(world);
    const calls = {
      shows: [] as Array<{ count: number; targets: number[] }>,
      hides: 0,
    };
    const node: IComboNode = {
      showCombo: (count, targets) => calls.shows.push({ count, targets }),
      hideCombo: () => { calls.hides += 1; },
    };
    registerComboNode(eid, node);
    registered.push(eid);

    ComboComponent.comboCount[eid] = 3;
    ComboComponent.targetHole0[eid] = 1;
    ComboComponent.targetHole1[eid] = 2;
    ComboComponent.targetHole2[eid] = 0;
    ComboComponent.comboID[eid] = 10;

    comboViewBinding(eid, BIT_COMBO_COUNT | BIT_COMBO_TARGETS | BIT_COMBO_ID, false);

    expect(calls.shows).toEqual([{ count: 3, targets: [1, 2] }]);
    expect(calls.hides).toBe(0);
  });
});
