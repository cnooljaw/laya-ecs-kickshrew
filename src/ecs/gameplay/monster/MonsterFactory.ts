import { MONSTER_CONFIG, type MonsterSpawnRule } from "../../../config/MonsterConfig";
import { MonsterComponent, MonsterSpawnComponent } from "./MonsterComponent";
import { MonsterType } from "./MonsterTypes";
import type { EntityRuntime } from "../../runtime/EntityRuntime";
import { MonsterEntity, MonsterTriggerEntity } from "./MonsterEntity";

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
  rules: readonly MonsterSpawnRule[],
): number[] {
  const inputs: MonsterType[] = [];
  const countByType = new Map<MonsterType, number>();
  for (const rule of rules) {
    countByType.set(
      rule.monsterType,
      (countByType.get(rule.monsterType) ?? 0) + Math.max(0, Math.floor(rule.maxActiveCount)),
    );
  }
  for (const [monsterType, count] of countByType) {
    for (let index = 0; index < count; index++) inputs.push(monsterType);
  }
  return entities.createMany(MonsterEntity, inputs);
}

export function spawnMonster(eid: number, monsterType: MonsterType): void {
  const config = MONSTER_CONFIG[monsterType];
  MonsterComponent.monsterType[eid] = monsterType;
  MonsterComponent.posX[eid] = config.posX;
  MonsterComponent.posY[eid] = config.posY;
  MonsterComponent.scale[eid] = config.scale;
  MonsterComponent.visible[eid] = 1;
  MonsterComponent.ageSec[eid] = 0;
  MonsterComponent.durationSec[eid] = config.durationSec;
  MonsterComponent.spawnSeq[eid] += 1;
}
