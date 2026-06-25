import type { EntityType } from "../ecs/runtime/EntityType";
import type { ProjectionDefinition } from "../sync/projection/ProjectionDefinition";
import type { FeatureRuntimeContext } from "./FeatureRuntimeContext";
import type {
  GameFeature,
  GameSystem,
  GameSystemPhase,
} from "./GameFeature";

export interface RegisteredGameSystem {
  readonly name: string;
  readonly run: GameSystem;
}

export interface GameFeatureRegistry {
  setupAll(ctx: FeatureRuntimeContext): void;
  systemsByPhase(phase: GameSystemPhase): readonly RegisteredGameSystem[];
  entityTypes(): readonly EntityType<any>[];
  projections(): readonly ProjectionDefinition<any>[];
}

export function createGameFeatureRegistry(features: readonly GameFeature[]): GameFeatureRegistry {
  validateGameFeatures(features);
  const stateSystems = collectSystems(features, "state");
  const featureSystems = collectSystems(features, "feature");
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

export function validateGameFeatures(features: readonly GameFeature[]): void {
  const featureNames = new Set<string>();
  const systemNames = new Set<string>();
  const entityTypeNames = new Set<string>();
  const projectionNames = new Set<string>();

  for (const feature of features) {
    assertUnique(featureNames, feature.name, "GameFeature");

    for (const entityType of feature.entities ?? []) {
      assertUnique(entityTypeNames, entityType.name, "EntityType");
    }
    for (const projection of feature.projections ?? []) {
      assertUnique(projectionNames, projection.name, "Projection");
    }
    for (const phase of ["state", "feature"] as const) {
      for (const system of feature.systems?.[phase] ?? []) {
        assertUnique(systemNames, systemName(feature.name, phase, system), "FeatureSystem");
      }
    }
  }
}

function collectSystems(
  features: readonly GameFeature[],
  phase: GameSystemPhase,
): RegisteredGameSystem[] {
  const systems: RegisteredGameSystem[] = [];
  for (const feature of features) {
    for (const run of feature.systems?.[phase] ?? []) {
      systems.push({
        name: systemName(feature.name, phase, run),
        run,
      });
    }
  }
  return systems;
}

function systemName(featureName: string, phase: GameSystemPhase, run: GameSystem): string {
  return run.name || `${featureName}:${phase}`;
}

function assertUnique(names: Set<string>, name: string, kind: string): void {
  if (names.has(name)) throw new Error(`${kind} name 重复: ${name}`);
  names.add(name);
}

function collectFeatureItems<T>(
  features: readonly GameFeature[],
  select: (feature: GameFeature) => readonly T[] | undefined,
): T[] {
  const items: T[] = [];
  for (const feature of features) {
    for (const item of select(feature) ?? []) items.push(item);
  }
  return items;
}
