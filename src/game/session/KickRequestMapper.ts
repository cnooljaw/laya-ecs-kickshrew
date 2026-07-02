import { HOLE_PROTOCOL } from "../../config/GameTuning";
import type { KickRequest } from "../../network/ProtocolTypes";
import type { KickShrewHitResult } from "./KickHitDetection";

export function createKickRequest(
  hammerType: number,
  result: KickShrewHitResult,
): Omit<KickRequest, "seqId"> {
  return {
    cmd: "kick",
    hammerType,
    bKickShrew: 1,
    numOfShrew: 1,
    shrews: [{ shrewindex: result.hitHoleIndex + HOLE_PROTOCOL.clientIndexOffset, protectType: 0 }],
    comboID: 0,
  };
}
