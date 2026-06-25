import { describe, expect, it } from "vitest";
import { createGameWorld } from "../../ecs/world";
import { ViewRegistry } from "../../framework/view/ViewRegistry";
import { addComponent, addEntity, defineComponent, Types } from "bitecs";
import { createEntityRuntime } from "../../framework/ecs/EntityRuntime";
import { createProjectionRuntime } from "../../framework/sync/ProjectionRuntime";
import {
  defineProjection,
  projectionSource,
  watch,
} from "../../framework/sync/ProjectionDefinition";
import { createFeatureRuntimeContext } from "../../framework/feature/FeatureRuntimeContext";
import { createEffectRuntime } from "../../framework/sync/EffectRuntime";

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
      effectRuntime: createEffectRuntime(),
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

  it("views.create and resources.own share lifecycle cleanup", () => {
    const world = createGameWorld();
    const viewRegistry = new ViewRegistry();
    const destroyed: string[] = [];
    const node = {
      create(): void {},
      destroy(): void {
        destroyed.push("node");
      },
    };
    const owned = {
      destroy(): void {
        destroyed.push("owned");
      },
    };
    const context = createFeatureRuntimeContext({
      world,
      root: null,
      entityRuntime: createEntityRuntime(world, []),
      projectionRuntime: createProjectionRuntime([]),
      viewRegistry,
      effectRuntime: createEffectRuntime(),
    });

    context.views.create({ create: () => node });
    context.resources.own(owned);

    viewRegistry.clear();

    expect(destroyed).toEqual(["owned", "node"]);
  });
});
