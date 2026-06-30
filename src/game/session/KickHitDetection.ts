/**
 * KickHitDetection — 击打命中判定
 *
 * 职责:
 * 1. 检查锤子 hitTable 是否可用 (hitTable=1时可敲击)
 * 2. 比较触摸坐标与 Shrew/Monster 目标中心，选择半径内最近目标
 * 3. 击中 Shrew 时: hp-1, hasHat 处理(蓝鼠), 进入 Dizzy 短暂停留, isClickable=0
 * 4. 击中 Monster 时: hp-1，三击后释放占用洞位并发放奖励
 * 5. 击中后设 hitTable=0 防止连点 (~0.24秒后由锤子动画系统恢复)
 *
 * 此逻辑由触摸事件异步触发，不在帧循环中。
 */
import { defineQuery } from "bitecs";
import { HAMMER_RULES, HIT_DETECTION } from "../../config/GameTuning";
import {
  HammerComponent,
} from "../features/hammer/index";
import {
  MonsterComponent,
  releaseMonsterTriad,
} from "../features/monster/index";
import { PlayerComponent } from "../features/playerHud/index";
import {
  BoardOccupantKind,
  BoardPositionComponent,
  HoleComponent,
} from "../features/board/index";
import {
  ShrewComponent,
  ShrewType,
  startShrewDizzyHold,
} from "../features/shrew/index";

const holeQuery = defineQuery([HoleComponent]);
const shrewQuery = defineQuery([ShrewComponent, BoardPositionComponent]);
const monsterQuery = defineQuery([MonsterComponent, BoardPositionComponent]);
const hammerQuery = defineQuery([HammerComponent]);
const playerQuery = defineQuery([PlayerComponent]);

export const enum KickHitTargetKind {
  None = 0,
  Shrew = 1,
  Monster = 2,
}

/** 击中结果 */
export interface KickHitResult {
  bKickShrew: number;     // 1=击中地鼠, 0=未击中地鼠
  hitHoleIndex: number;   // 击中的洞位索引 (0~8), -1=无
  hitHoleEid: number;     // 击中的洞位 eid, -1=无
  hitShrewEid: number;    // 击中的地鼠 eid, -1=无
  hitMonsterEid: number;  // 击中的 Monster eid, -1=无
  hitShrewType: number;   // 被击地鼠类型
  numOfShrew: number;     // 击中地鼠数量
  targetKind: KickHitTargetKind;
}

/** 洞位点击判定半径比例 (相对屏幕尺寸) */
const HIT_RADIUS_RATIO = HIT_DETECTION.radiusRatio;

/**
 * 击打命中判定
 * @param world ECS 世界
 * @param touchXRatio 触摸 X 比例 (0~1, 相对屏幕宽度)
 * @param touchYRatio 触摸 Y 比例 (0~1, 相对屏幕高度)
 * @returns 击中结果
 */
export function detectKickHit(world: any, touchXRatio: number, touchYRatio: number): KickHitResult {
  const emptyResult: KickHitResult = {
    bKickShrew: 0,
    hitHoleIndex: -1,
    hitHoleEid: -1,
    hitShrewEid: -1,
    hitMonsterEid: -1,
    hitShrewType: 0,
    numOfShrew: 0,
    targetKind: KickHitTargetKind.None,
  };

  // 检查锤子 hitTable
  const hammerEntities = hammerQuery(world);
  if (hammerEntities.length === 0) return emptyResult;
  const hammerEid = hammerEntities[0];
  if (HammerComponent.hitTable[hammerEid] !== 1) return emptyResult;

  const target = findClosestTarget(world, touchXRatio, touchYRatio);
  if (!target) return emptyResult;

  if (target.kind === KickHitTargetKind.Monster) {
    applyMonsterHit(world, target.eid);
    HammerComponent.hitTable[hammerEid] = 0;
    HammerComponent.hitCooldownSec[hammerEid] = HAMMER_RULES.hitCooldownSec;
    return {
      ...emptyResult,
      hitMonsterEid: target.eid,
      targetKind: KickHitTargetKind.Monster,
    };
  }

  // 找到击中目标
  const shrewEid = target.eid;
  const shrewType = ShrewComponent.shrewType[shrewEid] as ShrewType;

  // 处理击中逻辑
  ShrewComponent.hp[shrewEid] -= 1;
  startShrewDizzyHold(shrewEid);

  // 蓝鼠帽子处理: hp>0 且 hasHat=1 时，帽子碎
  if (shrewType === ShrewType.Blue && ShrewComponent.hasHat[shrewEid] === 1 && ShrewComponent.hp[shrewEid] > 0) {
    ShrewComponent.hasHat[shrewEid] = 0;
  }

  // 设 hitTable=0 防止连点
  HammerComponent.hitTable[hammerEid] = 0;
  HammerComponent.hitCooldownSec[hammerEid] = HAMMER_RULES.hitCooldownSec;

  return {
    bKickShrew: 1,
    hitHoleIndex: target.holeIndex,
    hitHoleEid: target.holeEid,
    hitShrewEid: shrewEid,
    hitMonsterEid: -1,
    hitShrewType: shrewType,
    numOfShrew: 1,
    targetKind: KickHitTargetKind.Shrew,
  };
}

interface HitCandidate {
  kind: KickHitTargetKind.Shrew | KickHitTargetKind.Monster;
  eid: number;
  holeIndex: number;
  holeEid: number;
  dist: number;
}

function findClosestTarget(world: any, touchXRatio: number, touchYRatio: number): HitCandidate | undefined {
  let closest: HitCandidate | undefined;

  const shrews = shrewQuery(world);
  for (let i = 0; i < shrews.length; i++) {
    const eid = shrews[i];
    if (ShrewComponent.isClickable[eid] !== 1) continue;
    const hole = findShrewHole(world, eid);
    if (!hole) continue;
    const dist = distanceToTarget(touchXRatio, touchYRatio, eid);
    if (dist >= HIT_RADIUS_RATIO || (closest && dist >= closest.dist)) continue;
    closest = {
      kind: KickHitTargetKind.Shrew,
      eid,
      holeIndex: hole.index,
      holeEid: hole.eid,
      dist,
    };
  }

  const monsters = monsterQuery(world);
  for (let i = 0; i < monsters.length; i++) {
    const eid = monsters[i];
    if (MonsterComponent.visible[eid] !== 1 || MonsterComponent.hp[eid] <= 0) continue;
    const dist = distanceToTarget(touchXRatio, touchYRatio, eid);
    if (dist >= HIT_RADIUS_RATIO || (closest && dist >= closest.dist)) continue;
    closest = {
      kind: KickHitTargetKind.Monster,
      eid,
      holeIndex: -1,
      holeEid: -1,
      dist,
    };
  }

  return closest;
}

function findShrewHole(world: any, shrewEid: number): { eid: number; index: number } | undefined {
  let closestDist = Infinity;
  let found: { eid: number; index: number } | undefined;
  const holes = holeQuery(world);
  const expectedIndex = Math.round(ShrewComponent.holeIndex[shrewEid]);
  for (let i = 0; i < holes.length; i++) {
    const holeEid = holes[i];
    if (Math.round(HoleComponent.index[holeEid]) !== expectedIndex) continue;
    if (HoleComponent.occupantKind[holeEid] !== BoardOccupantKind.Shrew) continue;
    if (HoleComponent.occupantEid[holeEid] !== shrewEid) continue;
    const dist = Math.abs(HoleComponent.index[holeEid] - expectedIndex);
    if (dist < closestDist) {
      closestDist = dist;
      found = { eid: holeEid, index: expectedIndex };
    }
  }
  return found;
}

function distanceToTarget(touchXRatio: number, touchYRatio: number, eid: number): number {
  const dx = touchXRatio - BoardPositionComponent.xRatio[eid];
  const dy = touchYRatio - BoardPositionComponent.yRatio[eid];
  return Math.sqrt(dx * dx + dy * dy);
}

function applyMonsterHit(world: any, monsterEid: number): void {
  MonsterComponent.hp[monsterEid] = Math.max(0, MonsterComponent.hp[monsterEid] - 1);
  MonsterComponent.hitSeq[monsterEid] += 1;
  if (MonsterComponent.hp[monsterEid] > 0) return;

  MonsterComponent.defeatedSeq[monsterEid] += 1;
  const players = playerQuery(world);
  if (players.length > 0) {
    PlayerComponent.money[players[0]] += MonsterComponent.reward[monsterEid];
  }
  releaseMonsterTriad(world, monsterEid);
}
