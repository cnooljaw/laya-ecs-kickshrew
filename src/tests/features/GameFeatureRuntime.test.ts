import { describe, expect, it } from "vitest";
import { createViewSyncRuntime } from "../../binding/ViewSyncRuntime";
import { getPerfTestRuntimeConfig } from "../../config/PerfTestConfig";
import { DirtyComponent } from "../../ecs/components";
import { createGameWorld, createSingletonEntities } from "../../ecs/world";
import { createFeatureSetupContext } from "../../features/GameFeatureRuntime";
import { HammerViewSync } from "../../binding/viewSyncs";
import { ViewRegistry } from "../../view/ViewRegistry";

describe("GameFeatureRuntime", () => {
  it("mount 自动注册节点并设置首次 full sync，clear 统一销毁资源", () => {
    const world = createGameWorld();
    const singletons = createSingletonEntities(world);
    const viewSyncRuntime = createViewSyncRuntime([HammerViewSync]);
    const viewRegistry = new ViewRegistry();
    const destroyed: string[] = [];
    const node = {
      setHammerType(): void {},
      setThunderActive(): void {},
      followTouch(): void {},
      playHitAnimation(): void {},
      destroy(): void {
        destroyed.push("node");
      },
    };
    const owned = {
      destroy(): void {
        destroyed.push("owned");
      },
    };
    const context = createFeatureSetupContext({
      world,
      root: null,
      singletons,
      perfConfig: getPerfTestRuntimeConfig(""),
      viewRegistry,
      viewSyncRuntime,
    });

    context.mount(HammerViewSync, singletons.hammer, node);
    context.own(owned);

    expect(viewSyncRuntime.registryFor(HammerViewSync).get(singletons.hammer)).toBe(node);
    expect(DirtyComponent.forceFullSync[singletons.hammer]).toBe(1);

    viewRegistry.clear();

    expect(viewSyncRuntime.registryFor(HammerViewSync).get(singletons.hammer)).toBeUndefined();
    expect(destroyed).toEqual(["owned", "node"]);
  });
});
