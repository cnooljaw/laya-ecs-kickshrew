import type { EntityRuntime } from "../../../framework/ecs/EntityRuntime";
import { MonsterComponent } from "./MonsterComponents";
import {
  MonsterEntity,
  MonsterTriggerEntity,
  type MonsterEntityInput,
} from "./MonsterEntities";
import type { MonsterSpawnRule } from "./MonsterRules";
import type { MonsterViewConfig } from "./MonsterViewConfig";
import type { MonsterType } from "./MonsterTypes";

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
        scale: view.scale,
        durationSec: durationSec[rule.monsterType],
      });
    }
  }
  return inputs;
}

export function spawnMonster(eid: number, monsterType: MonsterType): void {
  MonsterComponent.monsterType[eid] = monsterType;
  MonsterComponent.visible[eid] = 1;
  MonsterComponent.ageSec[eid] = 0;
  MonsterComponent.spawnSeq[eid] += 1;
}
