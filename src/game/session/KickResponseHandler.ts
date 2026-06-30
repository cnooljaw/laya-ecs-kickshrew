import { consoleHitTraceLogger, type HitTraceLogger } from "../../debug/HitTraceLogger";
import type { EffectRuntime } from "../../framework/sync/EffectRuntime";
import type { KickResponse } from "../../network/ProtocolTypes";
import {
  applyHammerKickResponse,
  findHammer,
} from "../features/hammer/index";
import {
  HitRewardEffect,
  applyPlayerKickResponse,
  findPlayer,
} from "../features/playerHud/index";
import { activateHammerThunderIfCharged } from "./HammerThunderSystem";

export function handleKickResponse(
  world: any,
  effects: Pick<EffectRuntime, "emit">,
  response: KickResponse,
  traceLogger: HitTraceLogger = consoleHitTraceLogger,
): void {
  const rewards = applyKickResponse(world, response, traceLogger);
  for (const reward of rewards) {
    effects.emit(HitRewardEffect, reward);
  }
}

export function applyKickResponse(
  world: any,
  response: KickResponse,
  traceLogger: HitTraceLogger = consoleHitTraceLogger,
): KickResponse["shrewResp"] {
  if (response.ret !== 0) {
    traceLogger.log("score.rejected", {
      seqId: response.seqId,
      ret: response.ret,
      resp: response,
    });
    return [];
  }

  const player = findPlayer(world);
  if (player !== undefined) {
    applyPlayerKickResponse(player, response, traceLogger);
  }
  const hammer = findHammer(world);
  if (hammer !== undefined) {
    applyHammerKickResponse(hammer, response);
  }
  activateHammerThunderIfCharged(world);
  return response.shrewResp ?? [];
}
