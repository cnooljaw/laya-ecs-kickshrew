import { addComponent, addEntity, createWorld, defineComponent, Types } from "bitecs";
import { describe, expect, it } from "vitest";
import {
  defineProjection,
  noProjection,
  projectionSource,
  watch,
} from "../../sync/projection/ProjectionDefinition";
import { createProjectionRuntime } from "../../sync/projection/ProjectionRuntime";

const CounterComponent = defineComponent({
  value: Types.ui32,
  max: Types.ui32,
  internal: Types.ui32,
});

interface CounterView {
  setValue(value: number, max: number): void;
}

const source = projectionSource("counter", CounterComponent);
const applyValue = ({ eid, node }: { eid: number; node: CounterView }) => {
  node.setValue(CounterComponent.value[eid], CounterComponent.max[eid]);
};
const CounterProjection = defineProjection<CounterView>({
  name: "counter",
  components: [CounterComponent],
  rows: [
    watch(source, ["value"], "value", applyValue),
    watch(source, ["max"], "max", applyValue),
    watch(source, ["internal"], "internal only", noProjection),
  ],
});

const UnknownProjection = defineProjection<CounterView>({
  name: "unknown",
  components: [CounterComponent],
  rows: [
    watch(source, ["value"], "value", applyValue),
  ],
});

function createCounter(world: any): number {
  const eid = addEntity(world);
  addComponent(world, CounterComponent, eid);
  CounterComponent.value[eid] = 1;
  CounterComponent.max[eid] = 10;
  CounterComponent.internal[eid] = 0;
  return eid;
}

function createNode() {
  return {
    values: [] as Array<{ value: number; max: number }>,
    setValue(value: number, max: number): void {
      this.values.push({ value, max });
    },
  };
}

describe("ProjectionRuntime", () => {
  it("force-syncs a mounted node once and skips unchanged frames", () => {
    const world = createWorld();
    const eid = createCounter(world);
    const node = createNode();
    const runtime = createProjectionRuntime([CounterProjection]);
    runtime.mount(CounterProjection, eid, node);

    runtime.mark(world);
    runtime.sync(world);
    runtime.mark(world);
    runtime.sync(world);

    expect(node.values).toEqual([{ value: 1, max: 10 }]);
    expect(runtime.nodeFor(CounterProjection, eid)).toBe(node);
  });

  it("projects changed fields and deduplicates shared apply functions", () => {
    const world = createWorld();
    const eid = createCounter(world);
    const node = createNode();
    const runtime = createProjectionRuntime([CounterProjection]);
    runtime.mount(CounterProjection, eid, node);
    runtime.mark(world);
    runtime.sync(world);
    node.values.length = 0;

    CounterComponent.value[eid] = 2;
    CounterComponent.max[eid] = 20;
    runtime.mark(world);
    runtime.sync(world);

    expect(node.values).toEqual([{ value: 2, max: 20 }]);
  });

  it("tracks dirty-only fields without calling the view", () => {
    const world = createWorld();
    const eid = createCounter(world);
    const node = createNode();
    const runtime = createProjectionRuntime([CounterProjection]);
    runtime.mount(CounterProjection, eid, node);
    runtime.mark(world);
    runtime.sync(world);
    node.values.length = 0;

    CounterComponent.internal[eid] = 1;
    runtime.mark(world);
    runtime.sync(world);

    expect(node.values).toEqual([]);
  });

  it("rejects definitions that were not compiled", () => {
    const runtime = createProjectionRuntime([CounterProjection]);

    expect(() => runtime.mount(UnknownProjection, 1, createNode())).toThrow(
      "Projection not compiled: unknown",
    );
    expect(() => runtime.nodeFor(UnknownProjection, 1)).toThrow(
      "Projection not compiled: unknown",
    );
  });

  it("clear releases projections, snapshots and node indexes", () => {
    const world = createWorld();
    const eid = createCounter(world);
    const node = createNode();
    const runtime = createProjectionRuntime([CounterProjection]);
    runtime.mount(CounterProjection, eid, node);
    runtime.mark(world);
    runtime.sync(world);

    runtime.clear();

    expect(runtime.projections()).toEqual([]);
    expect(() => runtime.mount(CounterProjection, eid, node)).toThrow(
      "Projection not compiled: counter",
    );
  });
});
