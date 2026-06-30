import { describe, expect, it } from "vitest";
import { createGameWorld } from "../../framework/ecs/GameWorld";
import { ViewRegistry } from "../../framework/view/ViewRegistry";
import { addComponent, addEntity, defineComponent, Types } from "bitecs";
import { createEntityRuntime } from "../../framework/ecs/EntityRuntime";
import { createProjectionRuntime } from "../../framework/sync/ProjectionRuntime";
import {
  defineProjection,
  projectionSource,
  watch,
} from "../../framework/sync/ProjectionDefinition";
import { createFeatureSetupContext } from "../../framework/feature/FeatureSetupContext";
import { createEffectRuntime } from "../../framework/sync/EffectRuntime";

const CounterComponent = defineComponent({
  value: Types.ui32,
});
const counterSource = projectionSource("counter", CounterComponent);
interface CounterView {
  readonly eid?: number;
  readonly index?: number;
  create(parent?: any): void;
  setValue(value: number): void;
  destroy(): void;
}

const CounterProjection = defineProjection<CounterView>({
  name: "counter",
  components: [CounterComponent],
  rows: [
    watch(counterSource, ["value"], "value", ({ eid, node }) => {
      node.setValue(CounterComponent.value[eid]);
    }),
  ],
});

describe("GameFeatureRuntime", () => {
  it("mountOne creates, registers and owns projection nodes", () => {
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
    const context = createFeatureSetupContext({
      root,
      entityRuntime,
      projectionRuntime,
      viewRegistry,
      effectRuntime: createEffectRuntime(),
    });

    context.mountOne({
      eid,
      projection: CounterProjection,
      create: () => node,
    });

    expect(projectionRuntime.nodeFor(CounterProjection, eid)).toBe(node);
    expect(lifecycle).toEqual(["create:root"]);

    viewRegistry.clear();

    expect(lifecycle).toEqual(["create:root", "destroy"]);
  });

  it("createView and own share lifecycle cleanup", () => {
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
    const context = createFeatureSetupContext({
      root: null,
      entityRuntime: createEntityRuntime(world, []),
      projectionRuntime: createProjectionRuntime([]),
      viewRegistry,
      effectRuntime: createEffectRuntime(),
    });

    context.createView({ create: () => node });
    context.own(owned);

    viewRegistry.clear();

    expect(destroyed).toEqual(["owned", "node"]);
  });

  it("mountPool creates nodes in stable eid order", () => {
    const world = createGameWorld();
    const eids = [addEntity(world), addEntity(world)];
    for (const eid of eids) addComponent(world, CounterComponent, eid);
    const context = createFeatureSetupContext({
      root: null,
      entityRuntime: createEntityRuntime(world, []),
      projectionRuntime: createProjectionRuntime([CounterProjection]),
      viewRegistry: new ViewRegistry(),
      effectRuntime: createEffectRuntime(),
    });

    const nodes = context.mountPool({
      eids,
      projection: CounterProjection,
      create: (eid, index) => ({
        eid,
        index,
        create(): void {},
        setValue(): void {},
        destroy(): void {},
      }),
    });

    expect(nodes.map(node => [node.eid, node.index])).toEqual([
      [eids[0], 0],
      [eids[1], 1],
    ]);
  });
});
