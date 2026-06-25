import type { PerfTestRuntimeConfig } from "../config/PerfTestConfig";
import type { EntityType } from "../ecs/runtime/EntityType";
import type { SingletonEntities } from "../ecs/world";
import type { ProjectionDefinition } from "../sync/projection/ProjectionDefinition";
import type { ViewSyncModule } from "../sync/viewSync/ViewSyncModule";
import type { Destroyable } from "../view/ViewRegistry";
import type { FeatureRuntimeContext } from "./FeatureRuntimeContext";

export type GameSystem = (world: any, deltaSec: number) => void;
export type GameSystemPhase = "state" | "feature";

export interface FeatureSystemEntry {
  phase: GameSystemPhase;
  name: string;
  run: GameSystem;
}

export function system(phase: GameSystemPhase, name: string, run: GameSystem): FeatureSystemEntry {
  return { phase, name, run };
}

export interface FeatureSystemGroups {
  state?: readonly GameSystem[];
  feature?: readonly GameSystem[];
}

export interface FeatureSetupContext extends FeatureRuntimeContext {
  /** @deprecated compatibility only; remove with the legacy runtime */
  readonly root: any;
  /** @deprecated compatibility only; remove with the legacy runtime */
  readonly singletons: SingletonEntities;
  /** @deprecated compatibility only; remove with the legacy runtime */
  readonly perfConfig: PerfTestRuntimeConfig;
  /** @deprecated compatibility only; remove with the legacy runtime */
  mount<TContract, TNode extends TContract & Destroyable>(
    sync: ViewSyncModule<TContract>,
    eid: number,
    node: TNode,
  ): TNode;
  /** @deprecated compatibility only; remove with the legacy runtime */
  own<TResource extends Destroyable>(resource: TResource): TResource;
}

export interface GameFeature {
  readonly name: string;
  setup?: (ctx: FeatureSetupContext) => void;
  entities?: readonly EntityType<any>[];
  projections?: readonly ProjectionDefinition<any>[];
  systems?: readonly FeatureSystemEntry[] | FeatureSystemGroups;
  /** @deprecated compatibility only; remove with the legacy runtime */
  viewSyncs?: readonly ViewSyncModule[];
}

export function defineGameFeature(feature: GameFeature): GameFeature {
  return feature;
}
