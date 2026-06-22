import { SyncView } from "../binding/SyncView";
import { animationTimerSystem } from "../ecs/systems/AnimationTimerSystem";
import { dirtyMarkSystem } from "../ecs/systems/DirtyMarkSystem";
import { hammerSystem } from "../ecs/systems/HammerSystem";
import { perfHeroSystem } from "../ecs/systems/PerfHeroSystem";
import { sceneCycleSystem } from "../ecs/systems/SceneCycleSystem";
import { shrewStateSystem } from "../ecs/systems/ShrewStateSystem";
import { NetworkAdapter } from "../network/NetworkAdapter";
import type { DirtyAspect } from "../ecs/dirty/DirtySchemaTypes";
import type { GameSystem } from "../features/GameFeature";

interface GameLoopPipelineDeps {
  world: any;
  network: NetworkAdapter;
  syncView: SyncView;
  featureSystems?: readonly GameSystem[];
  featureDirtyAspects?: readonly DirtyAspect[];
}

export class GameLoopPipeline {
  constructor(private readonly _deps: GameLoopPipelineDeps) {}

  update(deltaSec: number): void {
    const { world, network, syncView } = this._deps;

    animationTimerSystem(world, deltaSec);
    shrewStateSystem(world, deltaSec);
    sceneCycleSystem(world);
    hammerSystem(world, undefined, false, false, deltaSec);
    network.update();
    perfHeroSystem(world, deltaSec);
    for (const system of this._deps.featureSystems ?? []) {
      system(world, deltaSec);
    }
    dirtyMarkSystem(world, this._deps.featureDirtyAspects);
    syncView.sync(world);
  }
}
