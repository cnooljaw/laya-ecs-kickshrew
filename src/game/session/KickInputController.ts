import { DESIGN_RESOLUTION } from "../../config/GameTuning";
import {
  consoleHitTraceLogger,
  HitTraceLogger,
} from "../../debug/HitTraceLogger";
import type { EffectRuntime } from "../../framework/sync/EffectRuntime";
import { NetworkAdapter } from "../../network/NetworkAdapter";
import {
  findHammer,
  getHammerHitStatus,
  recordHammerFeedback,
} from "../features/hammer/index";
import { HitMissEffect } from "../features/playerHud/index";
import { detectKickHit, KickHitTargetKind } from "./KickHitDetection";
import { createKickRequest } from "./KickRequestMapper";

export const KICK_INPUT_SOUNDS = {
  hitOne:  "resources/sound/sound_shrew/Hit_One.wav",
  hitNull: "resources/sound/sound_shrew/Hit_Null.wav",
  mouse1:  "resources/sound/sound_shrew/mouse_1.wav",
} as const;

interface KickInputControllerDeps {
  world: any;
  hammerEid: number;
  network: NetworkAdapter;
  effects: Pick<EffectRuntime, "emit">;
  playSound: (url: string) => void;
  traceLogger?: HitTraceLogger;
}

export class KickInputController {
  constructor(private readonly _deps: KickInputControllerDeps) {}

  handleTouch(x: number, y: number): void {
    const { world, hammerEid, network, effects, playSound } = this._deps;
    const traceLogger = this._deps.traceLogger ?? consoleHitTraceLogger;
    const { xRatio, yRatio } = normalizeTouch(x, y);
    const hammer = getHammerHitStatus(hammerEid);
    traceLogger.log("input.touch", {
      x,
      y,
      xRatio,
      yRatio,
      hammerType: hammer.hammerType,
      hitTable: hammer.hitTable,
    });

    if (!hammer.canHit) {
      traceLogger.log("hit.blocked", {
        x,
        y,
        xRatio,
        yRatio,
        hitTable: hammer.hitTable,
        hitCooldownSec: hammer.hitCooldownSec,
      });
      playSound(KICK_INPUT_SOUNDS.hitNull);
      return;
    }

    const result = detectKickHit(world, xRatio, yRatio);
    recordHammerFeedback(hammerEid, x, y);

    if (result.targetKind === KickHitTargetKind.Monster) {
      traceLogger.log("monster.hit", {
        hitMonsterEid: result.hitMonsterEid,
      });
      playSound(KICK_INPUT_SOUNDS.hitOne);
      return;
    }

    if (result.targetKind === KickHitTargetKind.Shrew) {
      traceLogger.log("hit.detected", {
        hitHoleIndex: result.hitHoleIndex,
        hitHoleEid: result.hitHoleEid,
        hitShrewEid: result.hitShrewEid,
        hitShrewType: result.hitShrewType,
        numOfShrew: result.numOfShrew,
        actionState: result.actionState,
        actionStateName: result.actionStateName,
        animType: result.animType,
        animTypeName: result.animTypeName,
        dizzyTriggered: result.dizzyTriggered,
        isClickable: result.isClickable,
        hp: result.hp,
      });
      playSound(KICK_INPUT_SOUNDS.hitOne);
      playSound(KICK_INPUT_SOUNDS.mouse1);

      const request = createKickRequest(hammer.hammerType, result);
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
      hitTable: getHammerHitStatus(hammerEid).hitTable,
    });
    effects.emit(HitMissEffect, undefined);
    playSound(KICK_INPUT_SOUNDS.hitNull);
  }
}

export function createKickInputController(
  deps: Omit<KickInputControllerDeps, "hammerEid">,
): KickInputController {
  const hammerEid = findHammer(deps.world);
  if (hammerEid === undefined) {
    throw new Error("Hammer singleton is not initialized");
  }
  return new KickInputController({ ...deps, hammerEid });
}

export function normalizeTouch(x: number, y: number): { xRatio: number; yRatio: number } {
  return {
    xRatio: x / DESIGN_RESOLUTION.width,
    yRatio: y / DESIGN_RESOLUTION.height,
  };
}
