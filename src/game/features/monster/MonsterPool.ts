import type { EntityRuntime } from "../../../framework/ecs/EntityRuntime";
import {
  BoardOccupantKind,
  BoardPositionComponent,
  type BoardRuntime,
} from "../board/index";
import { MonsterComponent } from "./MonsterComponents";
import {
  MonsterEntity,
  MonsterTriggerEntity,
  type MonsterEntityInput,
} from "./MonsterEntities";
import type { MonsterSpawnRule } from "./MonsterRules";
import { MONSTER_TIMING } from "./MonsterRules";
import type { MonsterViewConfig } from "./MonsterViewConfig";
import { MonsterAction, type MonsterType } from "./MonsterTypes";
import { getMonsterTriadCenter, type MonsterHoleTriad } from "./MonsterHoleTriads";

export function createMonsterTriggerEntities(
  entities: EntityRuntime,
  rules: readonly MonsterSpawnRule[],
): number[] {
  return entities.createMany(
    MonsterTriggerEntity,
    rules.map((_, index) => index),
  );
}

export function createMonsterPool(
  entities: EntityRuntime,
  inputs: readonly MonsterEntityInput[],
): number[] {
  return entities.createMany(MonsterEntity, inputs);
}

export function createMonsterPoolInputs(
  rules: readonly MonsterSpawnRule[],
  viewConfig: Readonly<Record<MonsterType, MonsterViewConfig>>,
  durationSec: Readonly<Record<MonsterType, number>>,
): MonsterEntityInput[] {
  const inputs: MonsterEntityInput[] = [];
  for (const rule of rules) {
    const view = viewConfig[rule.monsterType];
    for (let index = 0; index < rule.maxActiveCount; index++) {
      inputs.push({
        monsterType: rule.monsterType,
        posX: view.posX,
        posY: view.posY,
        durationSec: durationSec[rule.monsterType],
      });
    }
  }
  return inputs;
}

export function spawnMonster(
  eid: number,
  monsterType: MonsterType,
  triad: MonsterHoleTriad,
  board: BoardRuntime,
): boolean {
  const center = getMonsterTriadCenter(triad, board);
  if (!board.tryOccupyTriad(triad, BoardOccupantKind.Monster, eid)) return false;

  MonsterComponent.monsterType[eid] = monsterType;
  MonsterComponent.visible[eid] = 1;
  MonsterComponent.ageSec[eid] = 0;
  MonsterComponent.actionState[eid] = MonsterAction.Drop;
  MonsterComponent.stateTimer[eid] = MONSTER_TIMING.dropSec;
  MonsterComponent.animationProgress[eid] = 0;
  MonsterComponent.holeA[eid] = triad[0];
  MonsterComponent.holeB[eid] = triad[1];
  MonsterComponent.holeC[eid] = triad[2];
  MonsterComponent.hp[eid] = 3;
  MonsterComponent.hitSeq[eid] = 0;
  MonsterComponent.reward[eid] = 30;
  BoardPositionComponent.xRatio[eid] = center.xRatio;
  BoardPositionComponent.yRatio[eid] = center.yRatio;
  BoardPositionComponent.zIndex[eid] = 80;
  MonsterComponent.spawnSeq[eid] += 1;
  return true;
}
