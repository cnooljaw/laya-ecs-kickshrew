import { HOLE_PROTOCOL } from "../../config/GameTuning";
import type { KickRequest } from "../../network/ProtocolTypes";
import type { KickHitResult } from "./KickHitDetection";

export function createKickRequest(
  hammerType: number,
  result: KickHitResult,
): Omit<KickRequest, "seqId"> {
  return {
    cmd: "kick",
    hammerType,
    bKickShrew: result.bKickShrew,
    numOfShrew: result.numOfShrew,
    shrews: result.bKickShrew
      ? [{ shrewindex: result.hitHoleIndex + HOLE_PROTOCOL.clientIndexOffset, protectType: 0 }]
      : [],
    comboID: 0,
  };
}
