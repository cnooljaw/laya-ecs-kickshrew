import { defineQuery } from "bitecs";
import { BoardPositionComponent } from "../board/index";
import { MonsterComponent } from "./MonsterComponents";
import { startMonsterDizzy } from "./MonsterSystems";
import { MonsterAction } from "./MonsterTypes";

export interface MonsterKickTarget {
  readonly eid: number;
  readonly xRatio: number;
  readonly yRatio: number;
}

export interface MonsterLocalHitResult {
  readonly hitMonsterEid: number;
  readonly defeated: boolean;
  readonly reward: number;
}

const monsterQuery = defineQuery([MonsterComponent, BoardPositionComponent]);

export function collectMonsterKickTargets(world: any): MonsterKickTarget[] {
  const targets: MonsterKickTarget[] = [];
  const monsters = monsterQuery(world);
  for (let i = 0; i < monsters.length; i++) {
    const eid = monsters[i];
    if (MonsterComponent.visible[eid] !== 1 || MonsterComponent.hp[eid] <= 0) continue;
    if (MonsterComponent.actionState[eid] !== MonsterAction.Stay) continue;
    targets.push({
      eid,
      xRatio: BoardPositionComponent.xRatio[eid],
      yRatio: BoardPositionComponent.yRatio[eid],
    });
  }
  return targets;
}

export function applyMonsterLocalHit(monsterEid: number): MonsterLocalHitResult {
  MonsterComponent.hp[monsterEid] = Math.max(0, MonsterComponent.hp[monsterEid] - 1);
  MonsterComponent.hitSeq[monsterEid] += 1;
  if (MonsterComponent.hp[monsterEid] > 0) {
    return { hitMonsterEid: monsterEid, defeated: false, reward: 0 };
  }

  MonsterComponent.defeatedSeq[monsterEid] += 1;
  startMonsterDizzy(monsterEid);
  return {
    hitMonsterEid: monsterEid,
    defeated: true,
    reward: MonsterComponent.reward[monsterEid],
  };
}
