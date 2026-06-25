import { PlayerEntity } from "../ecs/gameplay/hud/PlayerEntity";
import { HitMissEffect, HitRewardEffect } from "../effects/HitEffects";
import { PlayerProjection } from "../sync/projections/HudProjection";
import { HitEffectNode } from "../view/HitEffectNode";
import { PlayerHUD } from "../view/PlayerHUD";
import { defineGameFeature } from "../framework/feature/FeatureManifest";

export const HudFeature = defineGameFeature({
  name: "hud",
  entities: [PlayerEntity],
  projections: [PlayerProjection],
  setup: ({ entities, effects, views }) => {
    views.mount({
      eid: entities.one(PlayerEntity),
      projection: PlayerProjection,
      create: () => new PlayerHUD(),
    });
    const hitEffectNode = views.create({
      create: () => new HitEffectNode(),
    });
    effects.on(HitRewardEffect, payload => {
      hitEffectNode.showReward(payload.shrewIndex, payload.reward);
    });
    effects.on(HitMissEffect, () => {
      hitEffectNode.showMiss();
    });
  },
});
