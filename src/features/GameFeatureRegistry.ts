import type { DirtyAspect } from "../sync/dirty/DirtySchemaTypes";
import type { EntityType } from "../ecs/runtime/EntityType";
import type { ProjectionDefinition } from "../sync/projection/ProjectionDefinition";
import type { ViewSyncModule } from "../sync/viewSync/ViewSyncModule";
import type {
  FeatureSetupContext,
  FeatureSystemEntry,
  GameFeature,
  GameSystem,
  GameSystemPhase,
} from "./GameFeature";

export interface GameFeatureRegistry {
  setupAll(ctx: FeatureSetupContext): void;
  systemsByPhase(phase: GameSystemPhase): readonly FeatureSystemEntry[];
  entityTypes(): readonly EntityType<any>[];
  projections(): readonly ProjectionDefinition<any>[];
  dirtyAspects(): readonly DirtyAspect[];
  viewSyncs(): readonly ViewSyncModule[];
}

export function createGameFeatureRegistry(features: readonly GameFeature[]): GameFeatureRegistry {
  validateGameFeatures(features);
  const systems = collectSystems(features);
  const stateSystems = systems.filter(system => system.phase === "state");
  const featureSystems = systems.filter(system => system.phase === "feature");
  const entityTypes = collectFeatureItems(features, feature => feature.entities);
  const projections = collectFeatureItems(features, feature => feature.projections);
  const viewSyncs = collectFeatureItems(features, feature => feature.viewSyncs);
  const dirtyAspects = viewSyncs.map(sync => sync.dirtyAspect);

  return {
    setupAll: ctx => {
      for (const feature of features) {
        feature.setup?.(ctx);
      }
    },
    systemsByPhase: phase => phase === "state" ? stateSystems : featureSystems,
    entityTypes: () => entityTypes,
    projections: () => projections,
    dirtyAspects: () => dirtyAspects,
    viewSyncs: () => viewSyncs,
  };
}

export function validateGameFeatures(features: readonly GameFeature[]): void {
  const featureNames = new Set<string>();
  const viewSyncNames = new Set<string>();
  const systemNames = new Set<string>();
  const entityTypeNames = new Set<string>();
  const projectionNames = new Set<string>();

  for (const feature of features) {
    if (featureNames.has(feature.name)) {
      throw new Error(`GameFeature name 重复: ${feature.name}`);
    }
    featureNames.add(feature.name);

    for (const viewSync of feature.viewSyncs ?? []) {
      validateFeatureViewSync(feature, viewSync, viewSyncNames);
    }

    for (const entityType of feature.entities ?? []) {
      if (entityTypeNames.has(entityType.name)) {
        throw new Error(`EntityType name 重复: ${entityType.name}`);
      }
      entityTypeNames.add(entityType.name);
    }

    for (const projection of feature.projections ?? []) {
      if (projectionNames.has(projection.name)) {
        throw new Error(`Projection name 重复: ${projection.name}`);
      }
      projectionNames.add(projection.name);
    }

    for (const system of systemsOf(feature)) {
      if (systemNames.has(system.name)) {
        throw new Error(`FeatureSystem name 重复: ${system.name}`);
      }
      systemNames.add(system.name);
    }
  }
}

function collectSystems(features: readonly GameFeature[]): FeatureSystemEntry[] {
  const systems: FeatureSystemEntry[] = [];
  for (const feature of features) {
    systems.push(...systemsOf(feature));
  }
  return systems;
}

function systemsOf(feature: GameFeature): FeatureSystemEntry[] {
  const declared = feature.systems;
  if (!declared) return [];
  if (isLegacySystemEntries(declared)) return Array.from(declared);

  return [
    ...compileSystemGroup(feature.name, "state", declared.state),
    ...compileSystemGroup(feature.name, "feature", declared.feature),
  ];
}

function isLegacySystemEntries(
  systems: GameFeature["systems"],
): systems is readonly FeatureSystemEntry[] {
  return Array.isArray(systems);
}

function compileSystemGroup(
  featureName: string,
  phase: GameSystemPhase,
  systems: readonly GameSystem[] | undefined,
): FeatureSystemEntry[] {
  if (!systems) return [];
  return systems.map((run, index) => ({
    phase,
    name: run.name || `${featureName}:${phase}:${index}`,
    run,
  }));
}

function validateFeatureViewSync(
  feature: GameFeature,
  viewSync: ViewSyncModule,
  viewSyncNames: Set<string>,
): void {
  if (viewSyncNames.has(viewSync.name)) {
    throw new Error(`ViewSyncModule name 重复: ${viewSync.name}`);
  }
  viewSyncNames.add(viewSync.name);

  if (!viewSync.dirtyAspect.channels.some(item => item.dirtyTarget === viewSync.dirtyTarget)) {
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
