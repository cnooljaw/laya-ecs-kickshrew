import type { DirtyAspect } from "../sync/dirty/DirtySchemaTypes";
import type { ViewSyncChannel, ViewSyncModule } from "../sync/viewSync/ViewSyncModule";
import type { FeatureSetupContext, FeatureSystemEntry, GameFeature, GameSystemPhase } from "./GameFeature";

export interface GameFeatureRegistry {
  setupAll(ctx: FeatureSetupContext): void;
  systemsByPhase(phase: GameSystemPhase): readonly FeatureSystemEntry[];
  dirtyAspects(): readonly DirtyAspect[];
  viewSyncChannels(): readonly ViewSyncChannel[];
}

export function createGameFeatureRegistry(features: readonly GameFeature[]): GameFeatureRegistry {
  validateGameFeatures(features);
  const systems = collectFeatureItems(features, feature => feature.systems);
  const stateSystems = systems.filter(system => system.phase === "state");
  const featureSystems = systems.filter(system => system.phase === "feature");
  const viewSyncs = collectFeatureItems(features, feature => feature.viewSyncs);
  const dirtyAspects = viewSyncs.map(sync => sync.dirtyAspect);
  const viewSyncChannels = viewSyncs.map(sync => sync.channel);

  return {
    setupAll: ctx => {
      for (const feature of features) {
        feature.setup?.(ctx);
      }
    },
    systemsByPhase: phase => phase === "state" ? stateSystems : featureSystems,
    dirtyAspects: () => dirtyAspects,
    viewSyncChannels: () => viewSyncChannels,
  };
}

export function validateGameFeatures(features: readonly GameFeature[]): void {
  const featureNames = new Set<string>();
  const viewSyncNames = new Set<string>();
  const syncChannelNames = new Set<string>();
  const systemNames = new Set<string>();

  for (const feature of features) {
    if (featureNames.has(feature.name)) {
      throw new Error(`GameFeature name 重复: ${feature.name}`);
    }
    featureNames.add(feature.name);

    for (const viewSync of feature.viewSyncs ?? []) {
      validateFeatureViewSync(feature, viewSync, viewSyncNames, syncChannelNames);
    }

    for (const system of feature.systems ?? []) {
      if (systemNames.has(system.name)) {
        throw new Error(`FeatureSystem name 重复: ${system.name}`);
      }
      systemNames.add(system.name);
    }
  }
}

function validateFeatureViewSync(
  feature: GameFeature,
  viewSync: ViewSyncModule,
  viewSyncNames: Set<string>,
  syncChannelNames: Set<string>,
): void {
  if (viewSyncNames.has(viewSync.name)) {
    throw new Error(`ViewSyncModule name 重复: ${viewSync.name}`);
  }
  viewSyncNames.add(viewSync.name);

  const channel = viewSync.channel;
  if (syncChannelNames.has(channel.name)) {
    throw new Error(`SyncChannel name 重复: ${channel.name}`);
  }
  syncChannelNames.add(channel.name);

  if (!viewSync.dirtyAspect.channels.some(item => item.dirtyTarget === channel.dirtyTarget)) {
    throw new Error(
      `GameFeature ${feature.name} 的 ViewSyncModule 未声明对应 dirtyTarget: ${viewSync.name}`,
    );
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
