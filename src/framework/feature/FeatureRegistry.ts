import type { EntityDefinition } from "../ecs/EntityDefinition";
import type { ProjectionDefinition } from "../sync/ProjectionDefinition";
import type { FeatureSetupContext } from "./FeatureSetupContext";
import type {
  FeatureManifest,
  GameSystem,
  GameSystemPhase,
  SystemDefinition,
} from "./FeatureManifest";

export interface RegisteredGameSystem {
  readonly name: string;
  readonly run: GameSystem;
}

export interface GameFeatureRegistry {
  setupAll(ctx: FeatureSetupContext): void;
  systemsByPhase(phase: GameSystemPhase): readonly RegisteredGameSystem[];
  entityTypes(): readonly EntityDefinition<any>[];
  projections(): readonly ProjectionDefinition<any>[];
}

export interface GameFeatureRegistryOptions {
  readonly systems?: readonly SystemDefinition[];
}

export function createGameFeatureRegistry(
  features: readonly FeatureManifest[],
  options: GameFeatureRegistryOptions = {},
): GameFeatureRegistry {
  validateGameFeatures(features);
  validateRegistrySystems(features, options.systems ?? []);
  const stateSystems = collectSystems(features, "state", options.systems);
  const featureSystems = collectSystems(features, "feature", options.systems);
  const entityTypes = collectFeatureItems(features, feature => feature.entities);
  const projections = collectFeatureItems(features, feature => feature.projections);

  return {
    setupAll: ctx => {
      for (const feature of features) feature.setup?.(ctx);
    },
    systemsByPhase: phase => phase === "state" ? stateSystems : featureSystems,
    entityTypes: () => entityTypes,
    projections: () => projections,
  };
}

export function validateGameFeatures(features: readonly FeatureManifest[]): void {
  const featureNames = new Set<string>();
  const systemNames = new Set<string>();
  const entityTypeNames = new Set<string>();
  const projectionNames = new Set<string>();

  for (const feature of features) {
    assertUnique(featureNames, feature.name, "GameFeature");

    for (const entityType of feature.entities ?? []) {
      assertUnique(entityTypeNames, entityType.name, "EntityDefinition");
    }
    for (const projection of feature.projections ?? []) {
      assertUnique(projectionNames, projection.name, "Projection");
    }
    for (const system of feature.systems ?? []) {
      assertUnique(systemNames, system.name, "FeatureSystem");
    }
  }
}

function validateRegistrySystems(
  features: readonly FeatureManifest[],
  extraSystems: readonly SystemDefinition[],
): void {
  const systemNames = new Set<string>();
  for (const feature of features) {
    for (const system of feature.systems ?? []) {
      assertUnique(systemNames, system.name, "FeatureSystem");
    }
  }
  for (const system of extraSystems) {
    assertUnique(systemNames, system.name, "FeatureSystem");
  }
}

function collectSystems(
  features: readonly FeatureManifest[],
  phase: GameSystemPhase,
  extraSystems: readonly SystemDefinition[] = [],
): RegisteredGameSystem[] {
  const systems: RegisteredGameSystem[] = [];
  for (const feature of features) {
    for (const system of feature.systems ?? []) {
      if (system.phase !== phase) continue;
      systems.push({
        name: system.name,
        run: system.run,
      });
    }
  }
  for (const system of extraSystems) {
    if (system.phase !== phase) continue;
    systems.push({
      name: system.name,
      run: system.run,
    });
  }
  return systems;
}

function assertUnique(names: Set<string>, name: string, kind: string): void {
  if (names.has(name)) throw new Error(`${kind} name 重复: ${name}`);
  names.add(name);
}

function collectFeatureItems<T>(
  features: readonly FeatureManifest[],
  select: (feature: FeatureManifest) => readonly T[] | undefined,
): T[] {
  const items: T[] = [];
  for (const feature of features) {
    for (const item of select(feature) ?? []) items.push(item);
  }
  return items;
}
