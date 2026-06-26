import type { EntityDefinition } from "../ecs/EntityDefinition";
import type { ProjectionDefinition } from "../sync/ProjectionDefinition";
import type { FeatureSetupContext } from "./FeatureRuntimeContext";

export type GameSystem = (world: any, deltaSec: number) => void;
export type GameSystemPhase = "state" | "feature";

export interface SystemDefinition {
  readonly phase: GameSystemPhase;
  readonly name: string;
  readonly run: GameSystem;
}

export interface FeatureManifest {
  readonly name: string;
  setup?: (ctx: FeatureSetupContext) => void;
  entities?: readonly EntityDefinition<any>[];
  projections?: readonly ProjectionDefinition<any>[];
  systems?: readonly SystemDefinition[];
}

export function defineSystem(
  phase: GameSystemPhase,
  name: string,
  run: GameSystem,
): SystemDefinition {
  return { phase, name, run };
}

export function defineFeature(feature: FeatureManifest): FeatureManifest {
  return feature;
}
