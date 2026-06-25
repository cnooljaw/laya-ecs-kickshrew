import { addComponent, addEntity } from "bitecs";
import type { EntityDefinition } from "./EntityDefinition";

export interface EntityRuntime {
  bootstrapSingletons(): void;
  one<TInput>(type: EntityDefinition<TInput>): number;
  create<TInput>(type: EntityDefinition<TInput>, input: TInput): number;
  createMany<TInput>(type: EntityDefinition<TInput>, inputs: readonly TInput[]): number[];
  clear(): void;
}

export function createEntityRuntime(
  world: any,
  types: readonly EntityDefinition<any>[],
): EntityRuntime {
  const singletonEids = new Map<EntityDefinition<any>, number>();

  function createEntity<TInput>(type: EntityDefinition<TInput>, input: TInput): number {
    const eid = addEntity(world);
    for (const component of type.components) {
      addComponent(world, component, eid);
    }
    type.initialize(eid, input);
    return eid;
  }

  return {
    bootstrapSingletons: () => {
      for (const type of types) {
        if (type.cardinality !== "one" || singletonEids.has(type)) continue;
        singletonEids.set(type, createEntity(type, undefined));
      }
    },
    one: type => {
      if (type.cardinality !== "one") {
        throw new Error(`EntityDefinition ${type.name} is not a singleton`);
      }
      const eid = singletonEids.get(type);
      if (eid === undefined) {
        throw new Error(`EntityDefinition ${type.name} singleton is not initialized`);
      }
      return eid;
    },
    create: (type, input) => {
      if (type.cardinality === "one") {
        throw new Error(`EntityDefinition ${type.name} is singleton-only`);
      }
      return createEntity(type, input);
    },
    createMany: (type, inputs) => {
      if (type.cardinality === "one") {
        throw new Error(`EntityDefinition ${type.name} is singleton-only`);
      }
      const eids: number[] = [];
      for (const input of inputs) {
        eids.push(createEntity(type, input));
      }
      return eids;
    },
    clear: () => {
      singletonEids.clear();
    },
  };
}
