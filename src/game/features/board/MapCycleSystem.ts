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
import { HolePositions, getHoleZOrder } from "./HolePositions";
import { SCENE_CYCLE } from "./SceneConfig";
import { SceneComponent, HoleComponent } from "./BoardComponents";
import { MapType } from "./BoardTypes";

const sceneQuery = defineQuery([SceneComponent]);
const holeQuery = defineQuery([HoleComponent]);

export function mapCycleSystem(world: any, delta: number = 0): void {
  const sceneEntities = sceneQuery(world);
  if (sceneEntities.length === 0) return;

  const sceneEid = sceneEntities[0];
  SceneComponent.sceneTimer[sceneEid] += delta;
  const timer = SceneComponent.sceneTimer[sceneEid];
  const interval = SceneComponent.cycleInterval[sceneEid];

  if (timer < interval) return;

  // 切换场景
  const currentMap = SceneComponent.currentMap[sceneEid] as MapType;
  const nextIndex = (SCENE_CYCLE.indexOf(currentMap) + 1) % SCENE_CYCLE.length;
  const nextMap = SCENE_CYCLE[nextIndex];

  SceneComponent.currentMap[sceneEid] = nextMap;
  SceneComponent.sceneTimer[sceneEid] = 0;
  SceneComponent.transitioning[sceneEid] = 1;

  // 更新所有洞位的坐标比例和 zOrder
  const holeEntities = holeQuery(world);
  const holePos = HolePositions[nextMap];
  if (holePos) {
    for (let i = 0; i < holeEntities.length; i++) {
      const eid = holeEntities[i];
      HoleComponent.posXRatio[eid] = holePos.xRatios[i];
      HoleComponent.posYRatio[eid] = holePos.yRatios[i];
      HoleComponent.zIndex[eid] = getHoleZOrder(HoleComponent.gridRow[eid]);
      HoleComponent.occupantKind[eid] = HoleComponent.residentKind[eid];
      HoleComponent.occupantEid[eid] = HoleComponent.residentEid[eid];
    }
  }
}
