import type { EntityRuntime } from "../../../framework/ecs/EntityRuntime";
import { MonsterComponent } from "./MonsterComponents";
import {
  MonsterEntity,
  MonsterTriggerEntity,
  type MonsterEntityInput,
} from "./MonsterEntities";
import type { MonsterSpawnRule } from "./MonsterRules";
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

export function spawnMonster(eid: number, monsterType: MonsterType): void {
  MonsterComponent.monsterType[eid] = monsterType;
  MonsterComponent.visible[eid] = 1;
  MonsterComponent.ageSec[eid] = 0;
  MonsterComponent.spawnSeq[eid] += 1;
}
