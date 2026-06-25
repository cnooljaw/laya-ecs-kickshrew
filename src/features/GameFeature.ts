import type { EntityType } from "../ecs/runtime/EntityType";
import type { ProjectionDefinition } from "../sync/projection/ProjectionDefinition";
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
  entities?: readonly EntityType<any>[];
  projections?: readonly ProjectionDefinition<any>[];
  systems?: FeatureSystemGroups;
}

export function defineGameFeature(feature: GameFeature): GameFeature {
  return feature;
}
