import type { createEntityRuntime } from "../../framework/ecs/EntityRuntime";
import {
  type FeatureCapability,
  type FeatureSetupContext,
} from "../../framework/feature/FeatureSetupContext";

export function createSetupContext(entities: ReturnType<typeof createEntityRuntime>) {
  const mounts = new Map<string, number>();
  const capabilities = new Map<FeatureCapability<any>, any>();
  let resources = 0;
  const context: FeatureSetupContext = {
    entities,
    effects: {
      on: () => {},
      emit: () => {},
    },
    createView: ({ create }: any) => {
      resources++;
      return create();
    },
    mountOne: ({ projection, create }: any) => {
      mounts.set(projection.name, (mounts.get(projection.name) ?? 0) + 1);
      return create();
    },
    mountPool: ({ eids, projection, create }: any) => eids.map((eid: number, index: number) => {
      mounts.set(projection.name, (mounts.get(projection.name) ?? 0) + 1);
      return create(eid, index);
    }),
    mountSingleton: ({ entity, projection, create }: any) => {
      const eid = entities.one(entity);
      mounts.set(projection.name, (mounts.get(projection.name) ?? 0) + 1);
      return create(eid, 0);
    },
    createAndMountMany: ({ entity, inputs, projection, create }: any) => {
      const eids = entities.createMany(entity, inputs);
      return eids.map((eid: number, index: number) => {
        mounts.set(projection.name, (mounts.get(projection.name) ?? 0) + 1);
        return create(eid, index);
      });
    },
    provide: (capability, value) => {
      capabilities.set(capability, value);
    },
    use: capability => {
      if (!capabilities.has(capability)) {
        throw new Error(`Feature capability is not provided: ${capability.name}`);
      }
      return capabilities.get(capability);
    },
    own: <T extends { destroy(): void }>(resource: T) => {
      resources++;
      return resource;
    },
  };
  return {
    mounts,
    context,
    resourceCount: () => resources,
  };
}
