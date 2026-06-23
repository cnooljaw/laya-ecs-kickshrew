import type { PerfTestRuntimeConfig } from "../config/PerfTestConfig";
import type { SingletonEntities } from "../ecs/world";
import type { ViewSyncModule } from "../sync/viewSync/ViewSyncModule";
import type { HammerNode } from "../view/HammerNode";
import type { HitEffectNode } from "../view/HitEffectNode";
import type { PerfHeroSpinePoolGroup } from "../view/PerfHeroNode";
import type { ViewRegistry } from "../view/ViewRegistry";

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

export interface GameRuntimeRefs {
  hammerNode?: HammerNode;
  hitEffectNode?: HitEffectNode;
  perfHeroPool?: PerfHeroSpinePoolGroup;
}

export interface FeatureSetupContext {
  world: any;
  root: any;
  singletons: SingletonEntities;
  viewRegistry: ViewRegistry;
  perfConfig: PerfTestRuntimeConfig;
  runtimeRefs: GameRuntimeRefs;
  forceFullSyncEntities: number[];
}

export interface GameFeature {
  name: string;
  setup?: (ctx: FeatureSetupContext) => void;
  systems?: readonly FeatureSystemEntry[];
  viewSyncs?: readonly ViewSyncModule[];
}
