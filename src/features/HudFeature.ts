import { coreSyncChannels } from "../binding/CoreSyncChannels";
import { ComboDirtyAspect } from "../sync/dirty/aspects/ComboDirtyAspect";
import { HitDirtyAspect } from "../sync/dirty/aspects/HitDirtyAspect";
import { PlayerDirtyAspect } from "../sync/dirty/aspects/PlayerDirtyAspect";
import { ComboNode } from "../view/ComboNode";
import { HitEffectNode } from "../view/HitEffectNode";
import { PlayerHUD } from "../view/PlayerHUD";
import type { GameFeature } from "./GameFeature";

export const HudFeature: GameFeature = {
  name: "hud",
  dirtyAspects: [
    PlayerDirtyAspect,
    ComboDirtyAspect,
    HitDirtyAspect,
  ],
  syncChannels: coreSyncChannels(["player", "combo", "hit"]),
  setup: ({ root, singletons, viewRegistry, runtimeRefs, forceFullSyncEntities }) => {
    const playerHUD = new PlayerHUD();
    playerHUD.create(root);
    viewRegistry.registerPlayerHUD(singletons.player, playerHUD);

    const comboNode = new ComboNode();
    comboNode.create(root);
    viewRegistry.registerComboNode(singletons.combo, comboNode);

    const hitEffectNode = new HitEffectNode();
    hitEffectNode.create(root);
    viewRegistry.registerHitEffectNode(singletons.player, hitEffectNode);
    runtimeRefs.hitEffectNode = hitEffectNode;

    forceFullSyncEntities.push(singletons.player, singletons.combo);
  },
};
