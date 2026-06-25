import { addComponent, addEntity } from "bitecs";
import type { EntityType } from "./EntityType";

export interface EntityRuntime {
  bootstrapSingletons(): void;
  one<TInput>(type: EntityType<TInput>): number;
  create<TInput>(type: EntityType<TInput>, input: TInput): number;
  createMany<TInput>(type: EntityType<TInput>, inputs: readonly TInput[]): number[];
  clear(): void;
}

export function createEntityRuntime(
  world: any,
  types: readonly EntityType<any>[],
): EntityRuntime {
  const singletonEids = new Map<EntityType<any>, number>();

  function createEntity<TInput>(type: EntityType<TInput>, input: TInput): number {
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
        throw new Error(`EntityType ${type.name} is not a singleton`);
      }
      const eid = singletonEids.get(type);
      if (eid === undefined) {
        throw new Error(`EntityType ${type.name} singleton is not initialized`);
      }
      return eid;
    },
    create: (type, input) => {
      if (type.cardinality === "one") {
        throw new Error(`EntityType ${type.name} is singleton-only`);
      }
      return createEntity(type, input);
    },
    createMany: (type, inputs) => {
      if (type.cardinality === "one") {
        throw new Error(`EntityType ${type.name} is singleton-only`);
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
