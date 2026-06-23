import { defineQuery } from "bitecs";
import type { ViewBindingRule } from "../rules/ViewBindingRule";
import { bitsOf, toDirtyMarks } from "../rules/ViewBindingRule";
import type { DirtyAspect, DirtyStoreKey, DirtyTarget } from "./DirtySchemaTypes";

interface RuleDirtyChannelOptions {
  name: string;
  storeKey: DirtyStoreKey;
  dirtyTarget: DirtyTarget;
  rules: readonly ViewBindingRule<any>[];
}

interface RuleDirtyAspectOptions {
  name: string;
  description: string;
  requires: string[];
  components: any[];
  channel?: RuleDirtyChannelOptions;
  channels?: RuleDirtyChannelOptions[];
}

export function createRuleDirtyAspect(options: RuleDirtyAspectOptions): DirtyAspect {
  const query = defineQuery(options.components);
  const channels = options.channels ?? (options.channel ? [options.channel] : []);
  return {
    name: options.name,
    description: options.description,
    requires: options.requires,
    query,
    channels: channels.map(channel => ({
      name: channel.name,
      storeKey: channel.storeKey,
      dirtyTarget: channel.dirtyTarget,
      allBits: bitsOf(channel.rules),
      marks: toDirtyMarks(channel.rules),
    })),
  };
}
