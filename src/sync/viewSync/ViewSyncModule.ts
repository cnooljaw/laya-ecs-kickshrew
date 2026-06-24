import { createViewSyncDirtyAspect } from "../dirty/ViewSyncDirtyAspect";
import type { DirtyArray, DirtyAspect, DirtyTarget } from "../dirty/DirtySchemaTypes";
import { bitsOf } from "./ViewSyncSpec";
import type { ViewSyncSpec } from "./ViewSyncSpec";

export type ViewProjectFn = (eid: number, dirtyBits: number, forceFull: boolean) => void;

export interface ViewSyncChannel {
  name: string;
  dirtyTarget: DirtyTarget;
  dirtyArray: DirtyArray;
  watchedBits: number;
  project: ViewProjectFn;
}

export interface ViewSyncModule<TNode = any> {
  name: string;
  registryKey: string;
  spec: ViewSyncSpec<TNode>;
  dirtyAspect: DirtyAspect;
  dirtyTarget: DirtyTarget;
  dirtyArray: DirtyArray;
  watchedBits: number;
  describe: () => string[];
}

export interface ViewSyncModuleOptions<TNode> {
  name: string;
  aspectName: string;
  description: string;
  requires: string[];
  components: any[];
  registryKey?: string;
  dirtyTarget: DirtyTarget;
  spec: ViewSyncSpec<TNode>;
}

export function defineViewSyncModule<TNode>(
  options: ViewSyncModuleOptions<TNode>,
): ViewSyncModule<TNode> {
  const watchedBits = bitsOf(options.spec);
  const dirtyAspect = createViewSyncDirtyAspect({
    name: options.aspectName,
    description: options.description,
    requires: options.requires,
    components: options.components,
    channel: {
      name: options.name,
      dirtyTarget: options.dirtyTarget,
      spec: options.spec,
    },
  });

  return {
    name: options.name,
    registryKey: options.registryKey ?? options.name,
    spec: options.spec,
    dirtyAspect,
    dirtyTarget: options.dirtyTarget,
    dirtyArray: dirtyAspect.channels[0].dirtyArray,
    watchedBits,
    describe: () => describeViewSyncModule(options),
  };
}

export function describeViewSyncModule<TNode>(
  sync: Pick<ViewSyncModuleOptions<TNode>, "name" | "dirtyTarget" | "spec">,
): string[] {
  return sync.spec.map(rule => {
    const fields = rule.dirtyFields.map(field => field.path).join(", ");
    return `${fields} -> ${sync.dirtyTarget}.${rule.label} -> ${sync.name}`;
  });
}
