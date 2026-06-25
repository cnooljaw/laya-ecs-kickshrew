import { NetworkAdapter } from "../network/NetworkAdapter";
import type { GameFeatureRegistry } from "../features/GameFeatureRegistry";
import type { ProjectionRuntime } from "../sync/projection/ProjectionRuntime";
import type { EffectRuntime } from "../effects/EffectRuntime";

interface GameLoopPipelineDeps {
  world: any;
  network: NetworkAdapter;
  featureRegistry: GameFeatureRegistry;
  projectionRuntime?: Pick<ProjectionRuntime, "mark" | "sync">;
  effects?: Pick<EffectRuntime, "flush">;
}

export class GameLoopPipeline {
  constructor(private readonly _deps: GameLoopPipelineDeps) {}

  update(deltaSec: number): void {
    const { world, network } = this._deps;

    for (const system of this._deps.featureRegistry.systemsByPhase("state")) {
      system.run(world, deltaSec);
    }
    network.update();
    for (const system of this._deps.featureRegistry.systemsByPhase("feature")) {
      system.run(world, deltaSec);
    }
    this._deps.projectionRuntime?.mark(world);
    this._deps.projectionRuntime?.sync(world);
    this._deps.effects?.flush();
  }
}
