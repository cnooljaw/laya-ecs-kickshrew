import { SceneEntity } from "../../ecs/gameplay/core/CoreEntities";
import { HammerEntity } from "../../ecs/gameplay/hammer/HammerEntity";
import { PlayerEntity } from "../../ecs/gameplay/hud/PlayerEntity";
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
