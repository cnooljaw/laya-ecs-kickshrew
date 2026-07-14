/**
 * MapCycleSystem — 地图轮换系统
 *
 * 职责:
 * 1. 检查 sceneTimer >= cycleInterval 时切换场景
 * 2. 按 Meadow→Ship→Space→Meadow 循环
 * 3. 切换时重置 sceneTimer
 * 4. 切换时更新所有洞位坐标和层级
 */
import { defineQuery } from "bitecs";
import { SCENE_CYCLE } from "./SceneConfig";
import { SceneComponent } from "./BoardComponents";
import { applyMapToBoard } from "./BoardOps";
import { syncServerMap } from "./ServerMapSync";
import { MapType } from "./BoardTypes";

const sceneQuery = defineQuery([SceneComponent]);

export function mapCycleSystem(world: any, delta: number = 0): void {
  const sceneEntities = sceneQuery(world);
  if (sceneEntities.length === 0) return;

  const sceneEid = sceneEntities[0];
  if (SceneComponent.serverControlled[sceneEid] === 1) {
    syncServerMap(world);
    return;
  }
  SceneComponent.sceneTimer[sceneEid] += delta;
  const timer = SceneComponent.sceneTimer[sceneEid];
  const interval = SceneComponent.cycleInterval[sceneEid];

  if (timer < interval) return;

  // 切换场景
  const currentMap = SceneComponent.currentMap[sceneEid] as MapType;
  const nextIndex = (SCENE_CYCLE.indexOf(currentMap) + 1) % SCENE_CYCLE.length;
  const nextMap = SCENE_CYCLE[nextIndex];

  SceneComponent.sceneTimer[sceneEid] = 0;
  applyMapToBoard(world, nextMap);
}
