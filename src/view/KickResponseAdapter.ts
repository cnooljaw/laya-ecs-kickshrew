import {
  hitResponseSystem,
  type KickResponse,
} from "../ecs/gameplay/hud/HitResponseSystem";
import type { EffectRuntime } from "../framework/sync/EffectRuntime";
import { HitRewardEffect } from "../effects/HitEffects";

export function routeKickResponse(
  world: any,
  effects: Pick<EffectRuntime, "emit">,
  response: KickResponse,
): void {
  const rewards = hitResponseSystem(world, response);
  for (let index = 0; index < rewards.length; index++) {
    effects.emit(HitRewardEffect, rewards[index]);
  }
}
