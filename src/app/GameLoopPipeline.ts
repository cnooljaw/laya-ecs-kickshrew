import { NetworkAdapter } from "../network/NetworkAdapter";
import type { GameFeatureRuntime } from "../framework/feature/FeatureRegistry";
import type { ProjectionRuntime } from "../framework/sync/ProjectionRuntime";
import type { EffectRuntime } from "../framework/sync/EffectRuntime";

interface GameLoopPipelineDeps {
  world: any;
  network: NetworkAdapter;
  featureRuntime: GameFeatureRuntime;
  projectionRuntime?: Pick<ProjectionRuntime, "mark" | "sync">;
  effects?: Pick<EffectRuntime, "flush">;
}

export class GameLoopPipeline {
  constructor(private readonly _deps: GameLoopPipelineDeps) {}

  update(deltaSec: number): void {
    const { world, network } = this._deps;

    for (const system of this._deps.featureRuntime.systemsByPhase("state")) {
      system.run(world, deltaSec);
    }
    network.update();
    for (const system of this._deps.featureRuntime.systemsByPhase("feature")) {
      system.run(world, deltaSec);
    }
    this._deps.projectionRuntime?.mark(world);
    this._deps.projectionRuntime?.sync(world);
    this._deps.effects?.flush();
  }
}
