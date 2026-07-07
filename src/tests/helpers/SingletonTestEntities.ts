import { SceneEntity } from "../../game/board/assembly";
import { HammerEntity } from "../../game/features/hammer/assembly";
import { PlayerEntity } from "../../game/features/playerHud/assembly";
import { createEntityRuntime } from "../../framework/ecs/EntityRuntime";

export function createSingletonEntities(world: any): {
  hammer: number;
  scene: number;
  player: number;
} {
  const runtime = createEntityRuntime(world, [HammerEntity, SceneEntity, PlayerEntity]);
  runtime.bootstrapSingletons();
  return {
    hammer: runtime.one(HammerEntity),
    scene: runtime.one(SceneEntity),
    player: runtime.one(PlayerEntity),
  };
}
