/**
 * ComboSystem — 连击系统
 *
 * 击中地鼠时检查3x3相邻洞位，最多选3个可点击的地鼠作为连击目标。
 * 连击编号(comboID)每次递增，用于与服务器通信。
 *
 * 调用方式: comboSystem(world, hitHoleIndex) 由 HitDetectionSystem 传入被击洞位索引
 * comboCount=0 时不计算连击。
 */
import { defineQuery } from "bitecs";
import { ShrewComponent, HoleComponent, ComboComponent } from "../components";
import { HOLE_COUNT, GRID_SIZE } from "../types";

const holeQuery = defineQuery([HoleComponent]);
const comboQuery = defineQuery([ComboComponent]);

/**
 * 获取指定行列的相邻洞位索引
 * @param row 行号 (0~2)
 * @param col 列号 (0~2)
 * @returns 相邻洞位的索引数组
 */
export function getAdjacentHoles(row: number, col: number): number[] {
  const adjacent: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue; // 跳过自己
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
        adjacent.push(nr * GRID_SIZE + nc);
      }
    }
  }
  return adjacent;
}

/**
 * 连击系统
 * @param world ECS 世界
 * @param hitHoleIndex 被击中的洞位索引 (0~8)，-1 表示无击中
 */
export function comboSystem(world: any, hitHoleIndex: number = -1): void {
  const comboEntities = comboQuery(world);
  if (comboEntities.length === 0) return;

  const comboEid = comboEntities[0];
  const comboCount = ComboComponent.comboCount[comboEid];

  // comboCount=0 时不计算连击
  if (comboCount <= 0) {
    ComboComponent.targetHole0[comboEid] = 0;
    ComboComponent.targetHole1[comboEid] = 0;
    ComboComponent.targetHole2[comboEid] = 0;
    return;
  }

  // 无击中洞位，跳过
  if (hitHoleIndex < 0 || hitHoleIndex >= HOLE_COUNT) return;

  // 获取被击洞位的行列
  const hitRow = Math.floor(hitHoleIndex / GRID_SIZE);
  const hitCol = hitHoleIndex % GRID_SIZE;

  // 获取相邻洞位
  const adjacentIndices = getAdjacentHoles(hitRow, hitCol);

  // 构建 hole index → eid 映射
  const holeEntities = holeQuery(world);
  const holeIndexToEid: Map<number, number> = new Map();
  for (let i = 0; i < holeEntities.length; i++) {
    const eid = holeEntities[i];
    const row = HoleComponent.gridRow[eid];
    const col = HoleComponent.gridCol[eid];
    holeIndexToEid.set(row * GRID_SIZE + col, eid);
  }

  // 筛选可点击的相邻洞位
  const clickableAdjacents: number[] = [];
  for (const adjIdx of adjacentIndices) {
    const holeEid = holeIndexToEid.get(adjIdx);
    if (!holeEid) continue;
    const shrewEid = HoleComponent.shrewEid[holeEid];
    if (shrewEid <= 0) continue;
    if (ShrewComponent.isClickable[shrewEid] === 1) {
      clickableAdjacents.push(adjIdx);
    }
  }

  // 最多选3个连击目标
  const maxTargets = Math.min(clickableAdjacents.length, 3);
  ComboComponent.targetHole0[comboEid] = maxTargets >= 1 ? clickableAdjacents[0] + 1 : 0; // +1 因为源码用1~9
  ComboComponent.targetHole1[comboEid] = maxTargets >= 2 ? clickableAdjacents[1] + 1 : 0;
  ComboComponent.targetHole2[comboEid] = maxTargets >= 3 ? clickableAdjacents[2] + 1 : 0;

  // 递增 comboID
  ComboComponent.comboID[comboEid]++;
}
