import { comboSystem } from "../ecs/systems/ComboSystem";
import { hitDetectionSystem } from "../ecs/systems/HitDetectionSystem";
import { HammerComponent } from "../ecs/components";
import { SingletonEntities } from "../ecs/world";
import { NetworkAdapter } from "../network/NetworkAdapter";
import { DESIGN_RESOLUTION, HOLE_PROTOCOL } from "../config/GameTuning";

export const KICK_INPUT_SOUNDS = {
  hitOne:  "resources/sound/sound_shrew/Hit_One.wav",
  hitNull: "resources/sound/sound_shrew/Hit_Null.wav",
  mouse1:  "resources/sound/sound_shrew/mouse_1.wav",
} as const;

interface HammerInputNode {
  followTouch(x: number, y: number): void;
  playHitAnimation(): void;
}

interface KickInputAdapterDeps {
  world: any;
  singletons: SingletonEntities;
  network: NetworkAdapter;
  getHammerNode: () => HammerInputNode | null;
  playSound: (url: string) => void;
}

export class KickInputAdapter {
  constructor(private readonly _deps: KickInputAdapterDeps) {}

  handleTouch(x: number, y: number): void {
    const { world, singletons, network, getHammerNode, playSound } = this._deps;
    const xRatio = x / DESIGN_RESOLUTION.width;
    const yRatio = y / DESIGN_RESOLUTION.height;
    const result = hitDetectionSystem(world, xRatio, yRatio);

    const hammerNode = getHammerNode();
    if (hammerNode) {
      hammerNode.followTouch(x, y);
      hammerNode.playHitAnimation();
    }

    if (result.bKickShrew === 1) {
      playSound(KICK_INPUT_SOUNDS.hitOne);
      playSound(KICK_INPUT_SOUNDS.mouse1);

      comboSystem(world, result.hitHoleIndex);

      network.sendKick({
        cmd: "kick",
        hammerType: HammerComponent.selectedType[singletons.hammer],
        bKickShrew: result.bKickShrew,
        numOfShrew: result.numOfShrew,
        shrews: result.bKickShrew
          ? [{ shrewindex: result.hitHoleIndex + HOLE_PROTOCOL.clientIndexOffset, protectType: 0 }]
          : [],
        comboID: 0,
      }).catch(() => {});
      return;
    }

    playSound(KICK_INPUT_SOUNDS.hitNull);
  }
}
