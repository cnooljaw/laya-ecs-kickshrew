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
  setup: ({ root, singletons, mount }) => {
    const playerHUD = new PlayerHUD();
    playerHUD.create(root);
    mount(PlayerViewSync, singletons.player, playerHUD);

    const hitEffectNode = new HitEffectNode();
    hitEffectNode.create(root);
    mount(HitViewSync, singletons.player, hitEffectNode);
  },
};
