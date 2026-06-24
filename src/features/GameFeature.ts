import type { PerfTestRuntimeConfig } from "../config/PerfTestConfig";
import type { SingletonEntities } from "../ecs/world";
import type { ViewSyncModule } from "../sync/viewSync/ViewSyncModule";
import type { Destroyable } from "../view/ViewRegistry";

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

export interface FeatureSetupContext {
  world: any;
  root: any;
  singletons: SingletonEntities;
  perfConfig: PerfTestRuntimeConfig;
  mount<TContract, TNode extends TContract & Destroyable>(
    sync: ViewSyncModule<TContract>,
    eid: number,
    node: TNode,
  ): TNode;
  own<TResource extends Destroyable>(resource: TResource): TResource;
}

export interface GameFeature {
  name: string;
  setup?: (ctx: FeatureSetupContext) => void;
  systems?: readonly FeatureSystemEntry[];
  viewSyncs?: readonly ViewSyncModule[];
}
