import { NetworkAdapter } from "../network/NetworkAdapter";
import type { GameFeatureRuntime } from "../framework/feature/FeatureRegistry";
import type { ProjectionRuntime } from "../framework/sync/ProjectionRuntime";
import type { EffectRuntime } from "../framework/sync/EffectRuntime";
import { GAME_SYSTEM_PHASES } from "../framework/feature/FeatureManifest";

interface GameLoopPipelineDeps {
  world: any;
  network: NetworkAdapter;
  featureRuntime: GameFeatureRuntime;
  rebuild?: () => void;
  projectionRuntime?: Pick<ProjectionRuntime, "mark" | "sync">;
  effects?: Pick<EffectRuntime, "flush">;
}

export class GameLoopPipeline {
  private _rebuildRequested = false;

  constructor(private readonly _deps: GameLoopPipelineDeps) {}

  /** Schedules one scene-owned structural rebuild after derived systems. */
  requestRebuild(): void {
    this._rebuildRequested = true;
  }

  update(deltaSec: number): void {
    const { world, network } = this._deps;

    network.update();
    for (const phase of GAME_SYSTEM_PHASES) {
      for (const system of this._deps.featureRuntime.systemsByPhase(phase)) {
        system.run(world, deltaSec);
      }
    }
    if (this._rebuildRequested) {
      this._rebuildRequested = false;
      this._deps.rebuild?.();
    }
    this._deps.projectionRuntime?.mark(world);
    this._deps.projectionRuntime?.sync(world);
    this._deps.effects?.flush();
  }
}
