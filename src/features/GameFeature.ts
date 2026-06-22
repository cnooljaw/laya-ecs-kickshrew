import type { DirtyAspect } from "../ecs/dirty/DirtySchemaTypes";
import type { SyncChannel } from "../binding/SyncView";
import type { ViewRegistry } from "../view/ViewRegistry";

export type GameSystem = (world: any, deltaSec: number) => void;

export interface FeatureSetupContext {
  world: any;
  root: any;
  viewRegistry: ViewRegistry;
  forceFullSyncEntities: number[];
}

export interface GameFeature {
  name: string;
  setup?: (ctx: FeatureSetupContext) => void;
  systems?: readonly GameSystem[];
  dirtyAspects?: readonly DirtyAspect[];
  syncChannels?: readonly SyncChannel[];
}
