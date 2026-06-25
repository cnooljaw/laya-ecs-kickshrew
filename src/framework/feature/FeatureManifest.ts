import type { EntityDefinition } from "../ecs/EntityDefinition";
import type { ProjectionDefinition } from "../sync/ProjectionDefinition";
import type { FeatureRuntimeContext } from "./FeatureRuntimeContext";

export type GameSystem = (world: any, deltaSec: number) => void;
export type GameSystemPhase = "state" | "feature";

export interface FeatureSystemGroups {
  state?: readonly GameSystem[];
  feature?: readonly GameSystem[];
}

export interface GameFeature {
  readonly name: string;
  setup?: (ctx: FeatureRuntimeContext) => void;
  entities?: readonly EntityDefinition<any>[];
  projections?: readonly ProjectionDefinition<any>[];
  systems?: FeatureSystemGroups;
}

export function defineGameFeature(feature: GameFeature): GameFeature {
  return feature;
}
