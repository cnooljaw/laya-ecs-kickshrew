import { comboSystem } from "../ecs/systems/ComboSystem";
import { hitDetectionSystem } from "../ecs/systems/HitDetectionSystem";
import { AnimationComponent, HammerComponent, ShrewComponent } from "../ecs/components";
import { SingletonEntities } from "../ecs/world";
import { NetworkAdapter } from "../network/NetworkAdapter";
import { DESIGN_RESOLUTION, HOLE_PROTOCOL } from "../config/GameTuning";
import { ShrewAction } from "../ecs/types";
import {
  actionStateName,
  animTypeName,
  consoleHitTraceLogger,
  HitTraceLogger,
} from "../debug/HitTraceLogger";

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
  traceLogger?: HitTraceLogger;
}

export class KickInputAdapter {
  constructor(private readonly _deps: KickInputAdapterDeps) {}

  handleTouch(x: number, y: number): void {
    const { world, singletons, network, getHammerNode, playSound } = this._deps;
    const traceLogger = this._deps.traceLogger ?? consoleHitTraceLogger;
    const xRatio = x / DESIGN_RESOLUTION.width;
    const yRatio = y / DESIGN_RESOLUTION.height;
    traceLogger.log("input.touch", {
      x,
      y,
      xRatio,
      yRatio,
      hammerType: HammerComponent.selectedType[singletons.hammer],
      hitTable: HammerComponent.hitTable[singletons.hammer],
    });

    const result = hitDetectionSystem(world, xRatio, yRatio);

    const hammerNode = getHammerNode();
    if (hammerNode) {
      hammerNode.followTouch(x, y);
      hammerNode.playHitAnimation();
    }

    if (result.bKickShrew === 1) {
      const actionState = ShrewComponent.actionState[result.hitShrewEid];
      const animType = AnimationComponent.animType[result.hitShrewEid];
      traceLogger.log("hit.detected", {
        hitHoleIndex: result.hitHoleIndex,
        hitHoleEid: result.hitHoleEid,
        hitShrewEid: result.hitShrewEid,
        hitShrewType: result.hitShrewType,
        numOfShrew: result.numOfShrew,
        actionState,
        actionStateName: actionStateName(actionState),
        animType,
        animTypeName: animTypeName(animType),
        dizzyTriggered: actionState === ShrewAction.Dizzy,
        isClickable: ShrewComponent.isClickable[result.hitShrewEid],
        hp: ShrewComponent.hp[result.hitShrewEid],
      });
      playSound(KICK_INPUT_SOUNDS.hitOne);
      playSound(KICK_INPUT_SOUNDS.mouse1);

      comboSystem(world, result.hitHoleIndex);

      const request = {
        cmd: "kick",
        hammerType: HammerComponent.selectedType[singletons.hammer],
        bKickShrew: result.bKickShrew,
        numOfShrew: result.numOfShrew,
        shrews: result.bKickShrew
          ? [{ shrewindex: result.hitHoleIndex + HOLE_PROTOCOL.clientIndexOffset, protectType: 0 }]
          : [],
        comboID: 0,
      } as const;
      traceLogger.log("network.requestQueued", {
        hitHoleIndex: result.hitHoleIndex,
        hitShrewEid: result.hitShrewEid,
        request,
      });
      network.sendKick(request).catch((error: unknown) => {
        traceLogger.log("network.requestFailed", {
          hitHoleIndex: result.hitHoleIndex,
          hitShrewEid: result.hitShrewEid,
          error: String(error),
        });
      });
      return;
    }

    traceLogger.log("hit.miss", {
      x,
      y,
      xRatio,
      yRatio,
      hitTable: HammerComponent.hitTable[singletons.hammer],
    });
    playSound(KICK_INPUT_SOUNDS.hitNull);
  }
}
