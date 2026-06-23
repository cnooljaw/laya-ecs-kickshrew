import { createRuleDirtyAspect } from "../dirty/RuleDirtyAspect";
import type { DirtyAspect, DirtyStoreKey, DirtyTarget } from "../dirty/DirtySchemaTypes";
import { bitsOf } from "../rules/ViewBindingRule";
import type { ViewBindingRule } from "../rules/ViewBindingRule";

export type ViewProjectFn = (eid: number, dirtyBits: number, forceFull: boolean) => void;

export interface ViewSyncChannel {
  name: string;
  dirtyTarget: DirtyTarget;
  watchedBits: number;
  project: ViewProjectFn;
}

export interface ViewSyncModule<TNode = any> {
  name: string;
  rules: readonly ViewBindingRule<TNode>[];
  dirtyAspect: DirtyAspect;
  channel: ViewSyncChannel;
  describe: () => string[];
}

export interface RuleViewSyncModuleOptions<TNode> {
  name: string;
  aspectName: string;
  description: string;
  requires: string[];
  components: any[];
  storeKey: DirtyStoreKey;
  dirtyTarget: DirtyTarget;
  rules: readonly ViewBindingRule<TNode>[];
  project: ViewProjectFn;
}

export function defineViewSyncModule<TNode>(
  options: RuleViewSyncModuleOptions<TNode>,
): ViewSyncModule<TNode> {
  const watchedBits = bitsOf(options.rules);
  const dirtyAspect = createRuleDirtyAspect({
    name: options.aspectName,
    description: options.description,
    requires: options.requires,
    components: options.components,
    channel: {
      name: options.name,
      storeKey: options.storeKey,
      dirtyTarget: options.dirtyTarget,
      rules: options.rules,
    },
  });

  return {
    name: options.name,
    rules: options.rules,
    dirtyAspect,
    channel: {
      name: options.name,
      dirtyTarget: options.dirtyTarget,
      watchedBits,
      project: options.project,
    },
    describe: () => describeViewSyncModule(options),
  };
}

export function describeViewSyncModule<TNode>(
  sync: Pick<RuleViewSyncModuleOptions<TNode>, "name" | "dirtyTarget" | "rules">,
): string[] {
  return sync.rules.map(rule => {
    const fields = rule.dirtyFields.map(field => field.path).join(", ");
    return `${fields} -> ${sync.dirtyTarget}.${rule.label} -> ${sync.name}`;
  });
}
