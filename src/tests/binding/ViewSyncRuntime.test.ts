import { describe, expect, it } from "vitest";
import { createViewSyncRuntime } from "../../binding/ViewSyncRuntime";
import { ShrewAnimationViewSync, ShrewViewSync } from "../../binding/viewSyncs";

describe("ViewSyncRuntime", () => {
  it("不同 runtime 的相同 eid registry 互不覆盖", () => {
    const first = createViewSyncRuntime([ShrewViewSync]);
    const second = createViewSyncRuntime([ShrewViewSync]);
    const firstNode = { id: "first" } as any;
    const secondNode = { id: "second" } as any;

    first.registryFor(ShrewViewSync).register(1, firstNode);
    second.registryFor(ShrewViewSync).register(1, secondNode);

    expect(first.registryFor(ShrewViewSync).get(1)).toBe(firstNode);
    expect(second.registryFor(ShrewViewSync).get(1)).toBe(secondNode);
  });

  it("同一 runtime 中共享 registryKey 的模块共用节点 registry", () => {
    const runtime = createViewSyncRuntime([ShrewViewSync, ShrewAnimationViewSync]);

    expect(runtime.registryFor(ShrewViewSync))
      .toBe(runtime.registryFor(ShrewAnimationViewSync));
  });
});
