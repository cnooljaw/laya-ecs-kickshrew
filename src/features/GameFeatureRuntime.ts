import type { PerfTestRuntimeConfig } from "../config/PerfTestConfig";
import { DirtyComponent } from "../ecs/components";
import type { SingletonEntities } from "../ecs/world";
import type { ViewSyncRuntime } from "../binding/ViewSyncRuntime";
import type { FeatureSetupContext } from "./GameFeature";
import type { ViewRegistry } from "../view/ViewRegistry";

interface FeatureSetupRuntimeDeps {
  world: any;
  root: any;
  singletons: SingletonEntities;
  perfConfig: PerfTestRuntimeConfig;
  viewRegistry: ViewRegistry;
  viewSyncRuntime: ViewSyncRuntime;
}

export function createFeatureSetupContext(deps: FeatureSetupRuntimeDeps): FeatureSetupContext {
  return {
    world: deps.world,
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
