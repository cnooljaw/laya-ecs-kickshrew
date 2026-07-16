import { NetworkAdapter } from "../network/NetworkAdapter";
import type { GameFeatureRuntime } from "../framework/feature/FeatureRegistry";
import type { ProjectionRuntime } from "../framework/sync/ProjectionRuntime";
import type { EffectRuntime } from "../framework/sync/EffectRuntime";
import { GAME_SYSTEM_PHASES, type GameSystemPhase } from "../framework/feature/FeatureManifest";
import type { FrameDiagnostics } from "./FrameDiagnostics";

interface GameLoopPipelineDeps {
  world: any;
  network: NetworkAdapter;
  featureRuntime: GameFeatureRuntime;
  rebuild?: () => void;
  projectionRuntime?: Pick<ProjectionRuntime, "mark" | "sync">;
  effects?: Pick<EffectRuntime, "flush">;
  diagnostics?: FrameDiagnostics;
}

export class GameLoopPipeline {
  private _rebuildRequested = false;

  constructor(private readonly _deps: GameLoopPipelineDeps) {}

  /** Schedules one scene-owned structural rebuild after derived systems. */
  requestRebuild(): void {
    this._rebuildRequested = true;
  }

  update(deltaSec: number): void {
    if (!this._deps.diagnostics) {
      this.updateWithoutDiagnostics(deltaSec);
      return;
    }
    this.updateWithDiagnostics(deltaSec, this._deps.diagnostics);
  }

  private updateWithoutDiagnostics(deltaSec: number): void {
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

  private updateWithDiagnostics(deltaSec: number, diagnostics: FrameDiagnostics): void {
    const { world, network } = this._deps;
    diagnostics.beginFrame();
    try {
      this.measure("runtime", "network.update", () => network.update());
      for (const phase of GAME_SYSTEM_PHASES) {
        for (const system of this._deps.featureRuntime.systemsByPhase(phase)) {
          this.measure(phase, system.name, () => system.run(world, deltaSec));
        }
      }
      if (this._rebuildRequested) {
        this._rebuildRequested = false;
        this.measure("runtime", "scene.rebuild", () => this._deps.rebuild?.());
      }
      this.measure("runtime", "projection.mark", () => this._deps.projectionRuntime?.mark(world));
      this.measure("runtime", "projection.sync", () => this._deps.projectionRuntime?.sync(world));
      this.measure("runtime", "effects.flush", () => this._deps.effects?.flush());
    } finally {
      diagnostics.endFrame();
    }
  }

  private measure<T>(scope: GameSystemPhase | "runtime", name: string, work: () => T): T {
    return this._deps.diagnostics!.measure(scope, name, work);
  }
}
