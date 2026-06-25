import { describe, expect, it } from "vitest";
import { createViewSyncRuntime } from "../../binding/ViewSyncRuntime";
import { getPerfTestRuntimeConfig } from "../../config/PerfTestConfig";
import { DirtyComponent } from "../../ecs/components";
import { createGameWorld, createSingletonEntities } from "../../ecs/world";
import { createFeatureSetupContext } from "../../features/GameFeatureRuntime";
import { HammerViewSync } from "../../binding/viewSyncs";
import { ViewRegistry } from "../../view/ViewRegistry";
import { addComponent, addEntity, defineComponent, Types } from "bitecs";
import { createEntityRuntime } from "../../ecs/runtime/EntityRuntime";
import { createProjectionRuntime } from "../../sync/projection/ProjectionRuntime";
import {
  defineProjection,
  projectionSource,
  watch,
} from "../../sync/projection/ProjectionDefinition";
import { createFeatureRuntimeContext } from "../../features/FeatureRuntimeContext";

const CounterComponent = defineComponent({
  value: Types.ui32,
});
const counterSource = projectionSource("counter", CounterComponent);
const CounterProjection = defineProjection<{ setValue(value: number): void }>({
  name: "counter",
  components: [CounterComponent],
  rows: [
    watch(counterSource, ["value"], "value", ({ eid, node }) => {
      node.setValue(CounterComponent.value[eid]);
    }),
  ],
});

describe("GameFeatureRuntime", () => {
  it("views.mount creates, registers and owns projection nodes", () => {
    const world = createGameWorld();
    const eid = addEntity(world);
    addComponent(world, CounterComponent, eid);
    const entityRuntime = createEntityRuntime(world, []);
    const projectionRuntime = createProjectionRuntime([CounterProjection]);
    const viewRegistry = new ViewRegistry();
    const root = { name: "root" };
    const lifecycle: string[] = [];
    const node = {
      create(parent: any): void {
        lifecycle.push(`create:${parent.name}`);
      },
      setValue(): void {},
      destroy(): void {
        lifecycle.push("destroy");
      },
    };
    const context = createFeatureRuntimeContext({
      world,
      root,
      entityRuntime,
      projectionRuntime,
      viewRegistry,
    });

    context.views.mount({
      eid,
      projection: CounterProjection,
      create: () => node,
    });

    expect(projectionRuntime.nodeFor(CounterProjection, eid)).toBe(node);
    expect(lifecycle).toEqual(["create:root"]);

    viewRegistry.clear();

    expect(lifecycle).toEqual(["create:root", "destroy"]);
  });

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
