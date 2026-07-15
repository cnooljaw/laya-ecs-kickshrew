import { applyServerMapTimeline } from "../board";
import {
  applyServerGameSnapshot,
  applyServerShrewState,
  applyServerShrewTimeline,
} from "../features/shrew";
import type { GameSystem } from "../../framework/feature/FeatureManifest";
import { setServerClockSample } from "../../network/ServerClock";
import type {
  GameSnapshot,
  KickResponse,
  MapStatePush,
  ShrewStatePush,
  ShrewTimelinePush,
  TimeSyncResponse,
} from "../../network/ProtocolTypes";
import type { EffectRuntime } from "../../framework/sync/EffectRuntime";
import { handleKickResponse } from "./KickResponseHandler";

type GameIngressFact =
  | { readonly kind: "kickResponse"; readonly response: KickResponse }
  | { readonly kind: "snapshot"; readonly snapshot: GameSnapshot }
  | { readonly kind: "shrewTimeline"; readonly push: ShrewTimelinePush }
  | { readonly kind: "shrewState"; readonly push: ShrewStatePush }
  | { readonly kind: "mapState"; readonly push: MapStatePush }
  | { readonly kind: "timeSync"; readonly response: TimeSyncResponse };

export interface GameIngressQueue {
  enqueueKickResponse(response: KickResponse): void;
  enqueueSnapshot(snapshot: GameSnapshot): void;
  enqueueShrewTimeline(push: ShrewTimelinePush): void;
  enqueueShrewState(push: ShrewStatePush): void;
  enqueueMapState(push: MapStatePush): void;
  enqueueTimeSync(response: TimeSyncResponse): void;
  drain(world: any, effects: Pick<EffectRuntime, "emit">): void;
  clear(): void;
}

export function createGameIngressQueue(): GameIngressQueue {
  let pending: GameIngressFact[] = [];

  return {
    enqueueKickResponse: response => pending.push({ kind: "kickResponse", response }),
    enqueueSnapshot: snapshot => pending.push({ kind: "snapshot", snapshot }),
    enqueueShrewTimeline: push => pending.push({ kind: "shrewTimeline", push }),
    enqueueShrewState: push => pending.push({ kind: "shrewState", push }),
    enqueueMapState: push => pending.push({ kind: "mapState", push }),
    enqueueTimeSync: response => pending.push({ kind: "timeSync", response }),
    drain: (world, effects) => {
      const current = pending;
      pending = [];
      for (const fact of current) applyIngressFact(world, effects, fact);
    },
    clear: () => {
      pending.length = 0;
    },
  };
}

export function createGameIngressSystem(
  queue: GameIngressQueue,
  effects: Pick<EffectRuntime, "emit">,
): GameSystem {
  return world => queue.drain(world, effects);
}

function applyIngressFact(
  world: any,
  effects: Pick<EffectRuntime, "emit">,
  fact: GameIngressFact,
): void {
  switch (fact.kind) {
    case "kickResponse":
      handleKickResponse(world, effects, fact.response);
      return;
    case "snapshot":
      applyServerGameSnapshot(world, fact.snapshot);
      applyServerMapTimeline(world, fact.snapshot.mapTimeline);
      return;
    case "shrewTimeline":
      applyServerShrewTimeline(world, fact.push);
      return;
    case "shrewState":
      applyServerShrewState(world, fact.push);
      return;
    case "mapState":
      setServerClockSample(fact.push.serverTimeMs);
      applyServerMapTimeline(world, fact.push.timeline);
      return;
    case "timeSync": {
      const clientReceiveMs = Date.now();
      setServerClockSample(
        fact.response.serverTimeMs,
        (fact.response.clientSendMs + clientReceiveMs) / 2,
        clientReceiveMs - fact.response.clientSendMs,
      );
    }
  }
}
