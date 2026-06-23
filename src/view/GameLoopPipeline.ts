import { SyncView } from "../binding/SyncView";
import { dirtyMarkSystem } from "../sync/dirty/DirtyMarkSystem";
import { NetworkAdapter } from "../network/NetworkAdapter";
import type { GameFeatureRegistry } from "../features/GameFeatureRegistry";

interface GameLoopPipelineDeps {
  world: any;
  network: NetworkAdapter;
  syncView: SyncView;
  featureRegistry: GameFeatureRegistry;
}

export class GameLoopPipeline {
  constructor(private readonly _deps: GameLoopPipelineDeps) {}

  update(deltaSec: number): void {
    const { world, network, syncView } = this._deps;

    for (const system of this._deps.featureRegistry.systemsByPhase("state")) {
      system.run(world, deltaSec);
    }
    network.update();
    for (const system of this._deps.featureRegistry.systemsByPhase("feature")) {
      system.run(world, deltaSec);
    }
    dirtyMarkSystem(world, this._deps.featureRegistry.dirtyAspects());
    syncView.sync(world);
  }
}
