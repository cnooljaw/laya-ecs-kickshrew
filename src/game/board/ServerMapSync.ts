import { defineQuery } from "bitecs";
import { getServerNowMs } from "../../network/ServerClock";
import type { MapTimeline } from "../../network/ProtocolTypes";
import { applyMapToBoard } from "./BoardOps";
import { SceneComponent } from "./BoardComponents";
import { SCENE_CYCLE } from "./SceneConfig";
import { MapType } from "./BoardTypes";

const sceneQuery = defineQuery([SceneComponent]);

export function applyServerMapTimeline(world: any, timeline: MapTimeline, nowMs: number = getServerNowMs()): void {
  const scenes = sceneQuery(world);
  if (scenes.length === 0) return;
  const scene = scenes[0];
  if (SceneComponent.serverControlled[scene] === 1 && timeline.mapRevision < SceneComponent.mapRevision[scene]) return;

  SceneComponent.serverControlled[scene] = 1;
  SceneComponent.mapRevision[scene] = timeline.mapRevision;
  SceneComponent.mapStartedMs[scene] = timeline.mapStartedMs;
  SceneComponent.nextSwitchMs[scene] = timeline.nextSwitchMs;
  SceneComponent.nextMap[scene] = timeline.nextMap;
  SceneComponent.cycleMs[scene] = timeline.cycleMs;
  applyMapToBoard(world, timeline.currentMap as MapType);
  syncServerMap(world, nowMs);
}

export function syncServerMap(world: any, nowMs: number = getServerNowMs()): void {
  const scenes = sceneQuery(world);
  if (scenes.length === 0) return;
  const scene = scenes[0];
  if (SceneComponent.serverControlled[scene] !== 1) return;

  const cycleMs = SceneComponent.cycleMs[scene];
  let nextSwitchMs = SceneComponent.nextSwitchMs[scene];
  if (nextSwitchMs <= 0 || cycleMs <= 0 || nowMs < nextSwitchMs) return;

  let currentMap = SceneComponent.currentMap[scene] as MapType;
  let nextMap = SceneComponent.nextMap[scene] as MapType;
  while (nowMs >= nextSwitchMs) {
    currentMap = isPlayableMap(nextMap) ? nextMap : nextMapAfter(currentMap);
    applyMapToBoard(world, currentMap);
    SceneComponent.mapStartedMs[scene] = nextSwitchMs;
    nextMap = nextMapAfter(currentMap);
    nextSwitchMs += cycleMs;
  }
  SceneComponent.nextSwitchMs[scene] = nextSwitchMs;
  SceneComponent.nextMap[scene] = nextMap;
}

function nextMapAfter(currentMap: MapType): MapType {
  const index = SCENE_CYCLE.indexOf(currentMap);
  return SCENE_CYCLE[(index + 1 + SCENE_CYCLE.length) % SCENE_CYCLE.length];
}

function isPlayableMap(value: MapType): boolean {
  return value === MapType.Meadow || value === MapType.Ship || value === MapType.Space;
}
