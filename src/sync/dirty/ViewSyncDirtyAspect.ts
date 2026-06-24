import { defineQuery } from "bitecs";
import type { ViewSyncSpec } from "../viewSync/ViewSyncSpec";
import { bitsOf, toDirtyMarks } from "../viewSync/ViewSyncSpec";
import type { DirtyAspect, DirtyStoreKey, DirtyTarget } from "./DirtySchemaTypes";

interface ViewSyncDirtyChannelOptions {
  name: string;
  storeKey: DirtyStoreKey;
  dirtyTarget: DirtyTarget;
  spec: ViewSyncSpec<any>;
}

interface ViewSyncDirtyAspectOptions {
  name: string;
  description: string;
  requires: string[];
  components: any[];
  channel?: ViewSyncDirtyChannelOptions;
  channels?: ViewSyncDirtyChannelOptions[];
}

export function createViewSyncDirtyAspect(options: ViewSyncDirtyAspectOptions): DirtyAspect {
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
      allBits: bitsOf(channel.spec),
      marks: toDirtyMarks(channel.spec),
    })),
  };
}
