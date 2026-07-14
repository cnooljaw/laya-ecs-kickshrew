import { defineQuery } from "bitecs";
import { HOLE_PROTOCOL } from "../../../config/GameTuning";
import { RoomPhase, type GameSnapshot, type ShrewCycle, type ShrewStatePush, type ShrewTimelinePush } from "../../../network/ProtocolTypes";
import { AnimationComponent, ShrewComponent } from "./ShrewComponents";
import { getServerNowMs, setServerClockSample } from "../../../network/ServerClock";
import { AnimType, ShrewAction, ShrewType } from "./ShrewTypes";

const shrewQuery = defineQuery([ShrewComponent, AnimationComponent]);

export function applyServerGameSnapshot(world: any, snapshot: GameSnapshot): void {
  setServerClockSample(snapshot.serverTimeMs);
  clearServerShrewSlots(world, snapshot.timelineRev);
  if (snapshot.roomPhase !== RoomPhase.Running) return;
  for (const cycle of snapshot.activeCycles) applyCycle(world, cycle, snapshot.timelineRev);
}

export function applyServerShrewTimeline(world: any, push: ShrewTimelinePush): void {
  setServerClockSample(push.serverTimeMs);
  for (const cycle of push.cycles) applyCycle(world, cycle, push.timelineRev);
}

export function applyServerShrewState(world: any, push: ShrewStatePush): void {
  setServerClockSample(push.serverTimeMs);
  const eid = findShrewByServerHole(world, push.holeIndex);
  if (eid === undefined) return;
  if (ShrewComponent.serverControlled[eid] === 1 && ShrewComponent.spawnSeq[eid] !== push.spawnSeq) return;
  if (ShrewComponent.timelineRev[eid] > push.timelineRev) return;

  ShrewComponent.serverControlled[eid] = 1;
  ShrewComponent.timelineRev[eid] = push.timelineRev;
  ShrewComponent.spawnSeq[eid] = push.spawnSeq;
  ShrewComponent.hp[eid] = push.hp;
  ShrewComponent.isClickable[eid] = push.clickable ? 1 : 0;
  ShrewComponent.serverOverrideAction[eid] = push.actionState;
  ShrewComponent.serverOverrideStartMs[eid] = push.phaseStartMs;
  ShrewComponent.serverOverrideEndMs[eid] = push.phaseEndMs;
  syncServerShrewState(eid);
}

export function syncServerShrewState(eid: number, nowMs: number = getServerNowMs()): void {
  if (ShrewComponent.serverControlled[eid] !== 1) return;

  const overrideEnd = ShrewComponent.serverOverrideEndMs[eid];
  if (ShrewComponent.serverOverrideAction[eid] !== 0 && nowMs < overrideEnd) {
    applyAction(eid, ShrewComponent.serverOverrideAction[eid], ShrewComponent.serverOverrideStartMs[eid], overrideEnd, nowMs, false);
    return;
  }
  ShrewComponent.serverOverrideAction[eid] = 0;

  if (nowMs < ShrewComponent.waitStartMs[eid] || nowMs >= ShrewComponent.endMs[eid]) {
    applyAction(eid, ShrewAction.Wait, nowMs, nowMs, nowMs, false);
    return;
  }
  if (ShrewComponent.hp[eid] <= 0 && nowMs >= ShrewComponent.downStartMs[eid]) {
    applyAction(eid, ShrewAction.Dizzy, ShrewComponent.downStartMs[eid], ShrewComponent.endMs[eid], nowMs, false);
    return;
  }
  if (nowMs < ShrewComponent.upStartMs[eid]) {
    applyAction(eid, ShrewAction.Wait, ShrewComponent.waitStartMs[eid], ShrewComponent.upStartMs[eid], nowMs, false);
    return;
  }
  if (nowMs < ShrewComponent.standStartMs[eid]) {
    applyAction(eid, ShrewAction.Up, ShrewComponent.upStartMs[eid], ShrewComponent.standStartMs[eid], nowMs, false);
    return;
  }
  if (nowMs < ShrewComponent.downStartMs[eid]) {
    applyAction(eid, ShrewAction.Stand, ShrewComponent.standStartMs[eid], ShrewComponent.downStartMs[eid], nowMs, true);
    return;
  }
  applyAction(eid, ShrewAction.Down, ShrewComponent.downStartMs[eid], ShrewComponent.endMs[eid], nowMs, false);
}

function applyCycle(world: any, cycle: ShrewCycle, timelineRev: number): void {
  const eid = findShrewByServerHole(world, cycle.holeIndex);
  if (eid === undefined) return;
  if (ShrewComponent.serverControlled[eid] === 1 && ShrewComponent.timelineRev[eid] > timelineRev) return;

  ShrewComponent.serverControlled[eid] = 1;
  ShrewComponent.spawnSeq[eid] = cycle.spawnSeq;
  ShrewComponent.timelineRev[eid] = timelineRev;
  ShrewComponent.shrewType[eid] = cycle.shrewType;
  ShrewComponent.hp[eid] = cycle.hp;
  ShrewComponent.hasHat[eid] = cycle.shrewType === ShrewType.Blue && cycle.hp > 1 ? 1 : 0;
  ShrewComponent.waitStartMs[eid] = cycle.waitStartMs;
  ShrewComponent.upStartMs[eid] = cycle.upStartMs;
  ShrewComponent.standStartMs[eid] = cycle.standStartMs;
  ShrewComponent.downStartMs[eid] = cycle.downStartMs;
  ShrewComponent.endMs[eid] = cycle.endMs;
  ShrewComponent.serverOverrideAction[eid] = 0;
  ShrewComponent.serverOverrideStartMs[eid] = 0;
  ShrewComponent.serverOverrideEndMs[eid] = 0;
  syncServerShrewState(eid);
}

function clearServerShrewSlots(world: any, timelineRev: number): void {
  const shrews = shrewQuery(world);
  for (let i = 0; i < shrews.length; i++) {
    const eid = shrews[i];
    ShrewComponent.serverControlled[eid] = 1;
    ShrewComponent.timelineRev[eid] = timelineRev;
    ShrewComponent.spawnSeq[eid] = 0;
    ShrewComponent.hp[eid] = 0;
    ShrewComponent.isClickable[eid] = 0;
    ShrewComponent.actionState[eid] = ShrewAction.Wait;
    ShrewComponent.animTimer[eid] = 0;
    ShrewComponent.waitStartMs[eid] = 0;
    ShrewComponent.upStartMs[eid] = 0;
    ShrewComponent.standStartMs[eid] = 0;
    ShrewComponent.downStartMs[eid] = 0;
    ShrewComponent.endMs[eid] = 0;
    ShrewComponent.serverOverrideAction[eid] = 0;
    ShrewComponent.serverOverrideStartMs[eid] = 0;
    ShrewComponent.serverOverrideEndMs[eid] = 0;
    AnimationComponent.animType[eid] = AnimType.Idle;
    AnimationComponent.progress[eid] = 0;
    AnimationComponent.duration[eid] = 0;
  }
}

function applyAction(eid: number, action: number, phaseStartMs: number, phaseEndMs: number, nowMs: number, clickable: boolean): void {
  const durationMs = Math.max(0, phaseEndMs - phaseStartMs);
  const progress = durationMs === 0 ? 0 : clamp01((nowMs - phaseStartMs) / durationMs);
  ShrewComponent.actionState[eid] = action;
  ShrewComponent.isClickable[eid] = clickable ? 1 : 0;
  ShrewComponent.animTimer[eid] = Math.max(0, phaseEndMs - nowMs) / 1000;
  AnimationComponent.animType[eid] = toAnimType(action);
  AnimationComponent.progress[eid] = action === ShrewAction.Up || action === ShrewAction.Down ? progress : 0;
  AnimationComponent.duration[eid] = action === ShrewAction.Up || action === ShrewAction.Down ? durationMs / 1000 : 0;
}

function findShrewByServerHole(world: any, serverHoleIndex: number): number | undefined {
  const clientHoleIndex = serverHoleIndex - HOLE_PROTOCOL.clientIndexOffset;
  const shrews = shrewQuery(world);
  for (let i = 0; i < shrews.length; i++) {
    const eid = shrews[i];
    if (Math.round(ShrewComponent.holeIndex[eid]) === clientHoleIndex) return eid;
  }
  return undefined;
}

function toAnimType(action: number): AnimType {
  switch (action) {
    case ShrewAction.Up: return AnimType.Up;
    case ShrewAction.Stand: return AnimType.Stand;
    case ShrewAction.Down: return AnimType.Down;
    case ShrewAction.Dizzy: return AnimType.Dizzy;
    default: return AnimType.Idle;
  }
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
