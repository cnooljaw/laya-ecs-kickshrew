import type { ViewSyncChannel, ViewSyncModule } from "../sync/viewSync/ViewSyncModule";
import { createViewNodeRegistry, createViewSyncBinding, type ViewNodeRegistry } from "./ViewSyncBinding";

export interface ViewSyncRuntime {
  channels(): readonly ViewSyncChannel[];
  registryFor<TNode>(module: ViewSyncModule<TNode>): ViewNodeRegistry<TNode>;
  channelFor<TNode>(module: ViewSyncModule<TNode>): ViewSyncChannel;
  clear(): void;
}

export function createViewSyncRuntime(modules: readonly ViewSyncModule[]): ViewSyncRuntime {
  const registries = new Map<string, ViewNodeRegistry<any>>();
  const channels: ViewSyncChannel[] = [];
  const channelByModule = new Map<ViewSyncModule, ViewSyncChannel>();

  for (const module of modules) {
    let registry = registries.get(module.registryKey);
    if (!registry) {
      registry = createViewNodeRegistry();
      registries.set(module.registryKey, registry);
    }

    const channel: ViewSyncChannel = {
      name: module.name,
      dirtyTarget: module.dirtyTarget,
      dirtyArray: module.dirtyArray,
      watchedBits: module.watchedBits,
      project: createViewSyncBinding(registry, module.spec, module.dirtyTarget),
    };
    channels.push(channel);
    channelByModule.set(module, channel);
  }

  return {
    channels: () => channels,
    registryFor: module => {
      const registry = registries.get(module.registryKey);
      if (!registry) throw new Error(`ViewSyncModule 未编译: ${module.name}`);
      return registry;
    },
    channelFor: module => {
      const channel = channelByModule.get(module);
      if (!channel) throw new Error(`ViewSyncModule 未编译: ${module.name}`);
      return channel;
    },
    clear: () => {
      for (const registry of registries.values()) registry.clear();
      registries.clear();
      channels.length = 0;
      channelByModule.clear();
    },
  };
}
