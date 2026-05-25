/**
 * HitDetectionSystem — 触摸碰撞检测系统
 *
 * 职责:
 * 1. 检查锤子 hitTable 是否可用 (hitTable=1时可敲击)
 * 2. 将触摸坐标映射到洞位，检查该洞位地鼠是否可点击
 * 3. 击中时: hp-1, hasHat 处理(蓝鼠), 设 actionState=Dizzy, isClickable=0
 * 4. 击中后设 hitTable=0 防止连点 (~0.24秒后由锤子动画系统恢复)
 *
 * 此系统由触摸事件异步触发，不在帧循环中。
 */
import { defineQuery } from "bitecs";
import { ShrewComponent, HoleComponent, HammerComponent } from "../components";
import { ShrewAction, ShrewType, HOLE_COUNT } from "../types";

const holeQuery = defineQuery([HoleComponent]);
const hammerQuery = defineQuery([HammerComponent]);

/** 击中结果 */
export interface HitResult {
  bKickShrew: number;     // 1=击中, 0=未中
  hitHoleIndex: number;   // 击中的洞位索引 (0~8), -1=无
  hitShrewType: number;   // 被击地鼠类型
  numOfShrew: number;     // 击中地鼠数量
}

/** 洞位点击判定半径比例 (相对屏幕尺寸) */
const HIT_RADIUS_RATIO = 0.15;

/**
 * 触摸碰撞检测
 * @param world ECS 世界
 * @param touchXRatio 触摸 X 比例 (0~1, 相对屏幕宽度)
 * @param touchYRatio 触摸 Y 比例 (0~1, 相对屏幕高度)
 * @returns 击中结果
 */
export function hitDetectionSystem(world: any, touchXRatio: number, touchYRatio: number): HitResult {
  const emptyResult: HitResult = {
    bKickShrew: 0,
    hitHoleIndex: -1,
    hitShrewType: 0,
    numOfShrew: 0,
  };

  // 检查锤子 hitTable
  const hammerEntities = hammerQuery(world);
  if (hammerEntities.length === 0) return emptyResult;
  const hammerEid = hammerEntities[0];
  if (HammerComponent.hitTable[hammerEid] !== 1) return emptyResult;

  // 查找最近的可点击洞位
  const holeEntities = holeQuery(world);
  let closestHoleEid = -1;
  let closestHoleIndex = -1;
  let closestDist = Infinity;

  for (let i = 0; i < holeEntities.length; i++) {
    const eid = holeEntities[i];
    const x = HoleComponent.posXRatio[eid];
    const y = HoleComponent.posYRatio[eid];
    const dx = touchXRatio - x;
    const dy = touchYRatio - y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < closestDist && dist < HIT_RADIUS_RATIO) {
      const shrewEid = HoleComponent.shrewEid[eid];
      if (shrewEid > 0 && ShrewComponent.isClickable[shrewEid] === 1) {
        closestDist = dist;
        closestHoleEid = eid;
        closestHoleIndex = Math.round(HoleComponent.gridRow[eid]) * 3 + Math.round(HoleComponent.gridCol[eid]);
      }
    }
  }

  if (closestHoleEid < 0) return emptyResult;

  // 找到击中目标
  const shrewEid = HoleComponent.shrewEid[closestHoleEid];
  const shrewType = ShrewComponent.shrewType[shrewEid] as ShrewType;

  // 处理击中逻辑
  ShrewComponent.hp[shrewEid] -= 1;
  ShrewComponent.isClickable[shrewEid] = 0;
  ShrewComponent.actionState[shrewEid] = ShrewAction.Dizzy;

  // 蓝鼠帽子处理: hp>0 且 hasHat=1 时，帽子碎
  if (shrewType === ShrewType.Blue && ShrewComponent.hasHat[shrewEid] === 1 && ShrewComponent.hp[shrewEid] > 0) {
    ShrewComponent.hasHat[shrewEid] = 0;
  }

  // 设 hitTable=0 防止连点
  HammerComponent.hitTable[hammerEid] = 0;

  return {
    bKickShrew: 1,
    hitHoleIndex: closestHoleIndex,
    hitShrewType: shrewType,
    numOfShrew: 1,
  };
}
