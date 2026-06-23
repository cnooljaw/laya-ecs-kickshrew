import { HitViewSync, PlayerViewSync } from "../binding/viewSyncs";
import { HitEffectNode } from "../view/HitEffectNode";
import { PlayerHUD } from "../view/PlayerHUD";
import type { GameFeature } from "./GameFeature";

export const HudFeature: GameFeature = {
  name: "hud",
  viewSyncs: [
    PlayerViewSync,
    HitViewSync,
  ],
  setup: ({ root, singletons, viewRegistry, runtimeRefs, forceFullSyncEntities }) => {
    const playerHUD = new PlayerHUD();
    playerHUD.create(root);
    viewRegistry.registerPlayerHUD(singletons.player, playerHUD);

    const hitEffectNode = new HitEffectNode();
    hitEffectNode.create(root);
    viewRegistry.registerHitEffectNode(singletons.player, hitEffectNode);
    runtimeRefs.hitEffectNode = hitEffectNode;

    forceFullSyncEntities.push(singletons.player);
  },
};
