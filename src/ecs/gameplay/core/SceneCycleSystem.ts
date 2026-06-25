/**
 * SceneCycleSystem — 场景切换系统
 *
 * 职责:
 * 1. 检查 sceneTimer >= cycleInterval 时切换场景
 * 2. 按 Meadow→Ship→Space→Meadow 循环
 * 3. 切换时重置 sceneTimer
 * 4. 切换时所有地鼠重置为 Wait 状态
 */
import { defineQuery } from "bitecs";
import { SceneComponent, ShrewComponent, HoleComponent } from "../../components";
import { MapType } from "../../types";
import { SCENE_CYCLE } from "../../../config/SceneConfig";
import { HolePositions, getHoleZOrder } from "../../../config/HolePositions";
import { resetShrewForNextCycle } from "./ShrewLifecycle";

const sceneQuery = defineQuery([SceneComponent]);
const shrewQuery = defineQuery([ShrewComponent]);
const holeQuery = defineQuery([HoleComponent]);

export function sceneCycleSystem(world: any): void {
  const sceneEntities = sceneQuery(world);
  if (sceneEntities.length === 0) return;

  const sceneEid = sceneEntities[0];
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

  // 所有地鼠重置到下一轮等待
  const shrewEntities = shrewQuery(world);
  for (let i = 0; i < shrewEntities.length; i++) {
    const eid = shrewEntities[i];
    resetShrewForNextCycle(eid);
    ShrewComponent.mapType[eid] = nextMap;
  }

  // 更新所有洞位的坐标比例和 zOrder
  const holeEntities = holeQuery(world);
  const holePos = HolePositions[nextMap];
  if (holePos) {
    for (let i = 0; i < holeEntities.length; i++) {
      const eid = holeEntities[i];
      HoleComponent.posXRatio[eid] = holePos.xRatios[i];
      HoleComponent.posYRatio[eid] = holePos.yRatios[i];
      HoleComponent.zIndex[eid] = getHoleZOrder(HoleComponent.gridRow[eid]);
    }
  }
}
