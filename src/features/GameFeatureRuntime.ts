import type { PerfTestRuntimeConfig } from "../config/PerfTestConfig";
import { createEntityRuntime, type EntityRuntime } from "../ecs/runtime/EntityRuntime";
import { DirtyComponent } from "../ecs/components";
import type { SingletonEntities } from "../ecs/world";
import type { ViewSyncRuntime } from "../binding/ViewSyncRuntime";
import {
  createProjectionRuntime,
  type ProjectionRuntime,
} from "../sync/projection/ProjectionRuntime";
import type { FeatureSetupContext } from "./GameFeature";
import type { ViewRegistry } from "../view/ViewRegistry";
import { createFeatureRuntimeContext } from "./FeatureRuntimeContext";

interface FeatureSetupRuntimeDeps {
  world: any;
  root: any;
  singletons: SingletonEntities;
  perfConfig: PerfTestRuntimeConfig;
  viewRegistry: ViewRegistry;
  viewSyncRuntime: ViewSyncRuntime;
  entityRuntime?: EntityRuntime;
  projectionRuntime?: ProjectionRuntime;
}

export function createFeatureSetupContext(deps: FeatureSetupRuntimeDeps): FeatureSetupContext {
  const stableContext = createFeatureRuntimeContext({
    world: deps.world,
    root: deps.root,
    entityRuntime: deps.entityRuntime ?? createEntityRuntime(deps.world, []),
    projectionRuntime: deps.projectionRuntime ?? createProjectionRuntime([]),
    viewRegistry: deps.viewRegistry,
  });

  return {
    ...stableContext,
    root: deps.root,
    singletons: deps.singletons,
    perfConfig: deps.perfConfig,
    mount: (sync, eid, node) => {
      const registry = deps.viewSyncRuntime.registryFor(sync);
      DirtyComponent.forceFullSync[eid] = 1;
      return deps.viewRegistry.mount(eid, node, registry);
    },
    own: resource => deps.viewRegistry.own(resource),
  };
}
