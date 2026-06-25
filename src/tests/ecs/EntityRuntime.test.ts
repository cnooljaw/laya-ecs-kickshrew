import { defineComponent, defineQuery, Types, createWorld } from "bitecs";
import { describe, expect, it } from "vitest";
import {
  createEntityRuntime,
  defineEntity,
} from "../../framework/ecs";

const CounterComponent = defineComponent({
  value: Types.ui32,
});

const CounterSingleton = defineEntity({
  name: "counterSingleton",
  components: [CounterComponent],
  cardinality: "one",
  initialize: (eid: number) => {
    CounterComponent.value[eid] = 7;
  },
});

const CounterPoolEntity = defineEntity<number>({
  name: "counterPool",
  components: [CounterComponent],
  cardinality: "many",
  initialize: (eid, value) => {
    CounterComponent.value[eid] = value;
  },
});

describe("EntityRuntime", () => {
  it("bootstraps singleton definitions once and resolves their eid", () => {
    const world = createWorld();
    const runtime = createEntityRuntime(world, [CounterSingleton]);

    runtime.bootstrapSingletons();
    const eid = runtime.one(CounterSingleton);
    runtime.bootstrapSingletons();

    expect(CounterComponent.value[eid]).toBe(7);
    expect(runtime.one(CounterSingleton)).toBe(eid);
    expect(Array.from(defineQuery([CounterComponent])(world))).toEqual([eid]);
  });

  it("creates stable many-entity pools from business inputs", () => {
    const world = createWorld();
    const runtime = createEntityRuntime(world, [CounterPoolEntity]);

    const eids = runtime.createMany(CounterPoolEntity, [1, 2, 3]);

    expect(eids.map((eid) => CounterComponent.value[eid])).toEqual([1, 2, 3]);
    expect(Array.from(defineQuery([CounterComponent])(world))).toEqual(eids);
  });

  it("rejects invalid cardinality operations", () => {
    const world = createWorld();
    const runtime = createEntityRuntime(world, [CounterSingleton, CounterPoolEntity]);

    expect(() => runtime.create(CounterSingleton, undefined)).toThrow(
      "EntityDefinition counterSingleton is singleton-only",
    );
    expect(() => runtime.one(CounterPoolEntity)).toThrow(
      "EntityDefinition counterPool is not a singleton",
    );
  });

  it("clear releases runtime indexes without removing world entities", () => {
    const world = createWorld();
    const runtime = createEntityRuntime(world, [CounterSingleton]);
    runtime.bootstrapSingletons();
    const eid = runtime.one(CounterSingleton);

    runtime.clear();

    expect(() => runtime.one(CounterSingleton)).toThrow(
      "EntityDefinition counterSingleton singleton is not initialized",
    );
    expect(Array.from(defineQuery([CounterComponent])(world))).toEqual([eid]);
  });
});
