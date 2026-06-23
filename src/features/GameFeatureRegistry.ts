import type { DirtyAspect } from "../sync/dirty/DirtySchemaTypes";
import type { SyncChannel } from "../binding/SyncView";
import type { FeatureSetupContext, FeatureSystemEntry, GameFeature, GameSystemPhase } from "./GameFeature";

export interface GameFeatureRegistry {
  setupAll(ctx: FeatureSetupContext): void;
  systemsByPhase(phase: GameSystemPhase): readonly FeatureSystemEntry[];
  dirtyAspects(): readonly DirtyAspect[];
  syncChannels(): readonly SyncChannel[];
}

export function createGameFeatureRegistry(features: readonly GameFeature[]): GameFeatureRegistry {
  validateGameFeatures(features);
  const systems = collectFeatureItems(features, feature => feature.systems);
  const stateSystems = systems.filter(system => system.phase === "state");
  const featureSystems = systems.filter(system => system.phase === "feature");
  const dirtyAspects = collectFeatureItems(features, feature => feature.dirtyAspects);
  const syncChannels = collectFeatureItems(features, feature => feature.syncChannels);

  return {
    setupAll: ctx => {
      for (const feature of features) {
        feature.setup?.(ctx);
      }
    },
    systemsByPhase: phase => phase === "state" ? stateSystems : featureSystems,
    dirtyAspects: () => dirtyAspects,
    syncChannels: () => syncChannels,
  };
}

export function validateGameFeatures(features: readonly GameFeature[]): void {
  const featureNames = new Set<string>();
  const syncChannelNames = new Set<string>();
  const systemNames = new Set<string>();

  for (const feature of features) {
    if (featureNames.has(feature.name)) {
      throw new Error(`GameFeature name 重复: ${feature.name}`);
    }
    featureNames.add(feature.name);

    for (const channel of feature.syncChannels ?? []) {
      if (syncChannelNames.has(channel.name)) {
        throw new Error(`SyncChannel name 重复: ${channel.name}`);
      }
      syncChannelNames.add(channel.name);
    }

    for (const system of feature.systems ?? []) {
      if (systemNames.has(system.name)) {
        throw new Error(`FeatureSystem name 重复: ${system.name}`);
      }
      systemNames.add(system.name);
    }

    validateFeatureDirtySyncPair(feature);
  }
}

function validateFeatureDirtySyncPair(feature: GameFeature): void {
  const syncTargets = new Set((feature.syncChannels ?? []).map(channel => channel.dirtyTarget));
  for (const aspect of feature.dirtyAspects ?? []) {
    for (const channel of aspect.channels) {
      if (!syncTargets.has(channel.dirtyTarget)) {
        throw new Error(
          `GameFeature ${feature.name} 的 dirtyTarget 未注册 SyncChannel: ${channel.dirtyTarget}`,
        );
      }
    }
  }
}

function collectFeatureItems<T>(
  features: readonly GameFeature[],
  select: (feature: GameFeature) => readonly T[] | undefined,
): T[] {
  const items: T[] = [];
  for (const feature of features) {
    const selected = select(feature);
    if (!selected) continue;
    for (const item of selected) {
      items.push(item);
    }
  }
  return items;
}
