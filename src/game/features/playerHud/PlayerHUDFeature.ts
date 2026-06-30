import { defineFeature } from "../../../framework/feature/FeatureManifest";
import { HitEffectNode } from "./HitEffectNode";
import { HitMissEffect, HitRewardEffect } from "./HitEffects";
import { PlayerEntity } from "./PlayerEntities";
import { PlayerHUD } from "./PlayerHUD";
import { PlayerProjection } from "./PlayerProjection";

export const PlayerHUDFeature = defineFeature({
  name: "playerHud",
  entities: [PlayerEntity],
  projections: [PlayerProjection],
  setup: ({ entities, effects, mountOne, createView }) => {
    mountOne({
      eid: entities.one(PlayerEntity),
      projection: PlayerProjection,
      create: () => new PlayerHUD(),
    });
    const hitEffectNode = createView({
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
