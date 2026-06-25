import { addComponent, addEntity, createWorld } from "bitecs";
import { DirtyComponent } from "../../components";
import { MONSTER_CONFIG, type MonsterSpawnRule } from "../../../config/MonsterConfig";
import { MonsterComponent, MonsterSpawnComponent } from "./MonsterComponent";
import { MonsterType } from "./MonsterTypes";
import type { EntityRuntime } from "../../runtime/EntityRuntime";
import { MonsterEntity, MonsterTriggerEntity } from "./MonsterEntity";

type World = ReturnType<typeof createWorld>;

export interface CreateMonsterEntitiesOptions {
  count: number;
  monsterType?: MonsterType;
}

export function createMonsterSpawnState(world: World, ruleIndex: number = 0): number {
  const entity = addEntity(world);
  addComponent(world, MonsterSpawnComponent, entity);
  MonsterSpawnComponent.ruleIndex[entity] = ruleIndex;
  MonsterSpawnComponent.lastMilestone[entity] = 0;
  return entity;
}

export function createMonsterTriggerEntities(
  entities: EntityRuntime,
  rules: readonly MonsterSpawnRule[],
): number[] {
  return entities.createMany(
    MonsterTriggerEntity,
    rules.map((_, index) => index),
  );
}

export function createMonsterEntities(world: World, options: CreateMonsterEntitiesOptions): number[] {
  const count = Math.max(0, Math.floor(options.count));
  const monsterType = options.monsterType ?? MonsterType.Rhino;
  const config = MONSTER_CONFIG[monsterType];
  const entities: number[] = [];

  for (let i = 0; i < count; i++) {
    const entity = addEntity(world);
    addComponent(world, MonsterComponent, entity);
    addComponent(world, DirtyComponent, entity);

    MonsterComponent.monsterType[entity] = monsterType;
    MonsterComponent.posX[entity] = config.posX;
    MonsterComponent.posY[entity] = config.posY;
    MonsterComponent.scale[entity] = config.scale;
    MonsterComponent.visible[entity] = 0;
    MonsterComponent.ageSec[entity] = 0;
    MonsterComponent.durationSec[entity] = config.durationSec;
    MonsterComponent.spawnSeq[entity] = 0;
    DirtyComponent.monsterDirty[entity] = 0;
    DirtyComponent.forceFullSync[entity] = 0;

    entities.push(entity);
  }

  return entities;
}

export function createMonsterEntitiesForRules(
  world: World,
  rules: readonly MonsterSpawnRule[],
): number[] {
  const countByType = new Map<MonsterType, number>();
  for (const rule of rules) {
    countByType.set(
      rule.monsterType,
      (countByType.get(rule.monsterType) ?? 0) + Math.max(0, Math.floor(rule.maxActiveCount)),
    );
  }

  const entities: number[] = [];
  for (const [monsterType, count] of countByType) {
    entities.push(...createMonsterEntities(world, { monsterType, count }));
  }
  return entities;
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
