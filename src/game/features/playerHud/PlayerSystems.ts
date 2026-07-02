import { defineQuery } from "bitecs";
import type { HitTraceLogger } from "../../../debug/HitTraceLogger";
import { PlayerComponent } from "./PlayerComponents";

const playerQuery = defineQuery([PlayerComponent]);

export interface PlayerKickResponse {
  readonly seqId: number;
  readonly money: number;
  readonly angry: number;
  readonly power: number;
  readonly levelScore: number;
  readonly numOfShrew: number;
  readonly shrewResp: readonly unknown[];
}

export function findPlayer(world: any): number | undefined {
  return playerQuery(world)[0];
}

export function applyPlayerKickResponse(
  playerEid: number,
  response: PlayerKickResponse,
  traceLogger: HitTraceLogger,
): void {
  const moneyBefore = PlayerComponent.money[playerEid];
  const powerBefore = PlayerComponent.power[playerEid];
  const levelBefore = PlayerComponent.level[playerEid];
  PlayerComponent.money[playerEid] += response.money;
  PlayerComponent.angry[playerEid] = response.angry;
  PlayerComponent.power[playerEid] += response.power;
  PlayerComponent.level[playerEid] = response.levelScore;
  traceLogger.log("score.applied", {
    seqId: response.seqId,
    moneyBefore,
    moneyDelta: response.money,
    moneyAfter: PlayerComponent.money[playerEid],
    angryAfter: PlayerComponent.angry[playerEid],
    powerBefore,
    powerDelta: response.power,
    powerAfter: PlayerComponent.power[playerEid],
    levelBefore,
    levelAfter: PlayerComponent.level[playerEid],
    numOfShrew: response.numOfShrew,
    shrewResp: response.shrewResp,
  });
}

export function getPlayerAngry(playerEid: number): number {
  return PlayerComponent.angry[playerEid];
}

export function applyPlayerReward(playerEid: number, reward: number): void {
  PlayerComponent.money[playerEid] += reward;
}
