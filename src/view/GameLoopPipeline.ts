import { SyncView } from "../binding/SyncView";
import { animationTimerSystem } from "../ecs/systems/AnimationTimerSystem";
import { dirtyMarkSystem } from "../ecs/systems/DirtyMarkSystem";
import { hammerSystem } from "../ecs/systems/HammerSystem";
import { perfHeroSystem } from "../ecs/systems/PerfHeroSystem";
import { sceneCycleSystem } from "../ecs/systems/SceneCycleSystem";
import { shrewStateSystem } from "../ecs/systems/ShrewStateSystem";
import { NetworkAdapter } from "../network/NetworkAdapter";

interface GameLoopPipelineDeps {
  world: any;
  network: NetworkAdapter;
  syncView: SyncView;
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
    dirtyMarkSystem(world);
    syncView.sync(world);
  }
}
