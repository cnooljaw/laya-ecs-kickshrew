import { addComponent, addEntity, createWorld } from "bitecs";
import { DirtyComponent } from "../../ecs/components";
import { MONSTER_CONFIG } from "./MonsterConfig";
import { MonsterComponent, MonsterSpawnComponent } from "./MonsterComponent";
import { MonsterType } from "./MonsterTypes";

type World = ReturnType<typeof createWorld>;

export interface CreateMonsterEntitiesOptions {
  count: number;
  monsterType?: MonsterType;
}

export function createMonsterSpawnState(world: World): number {
  const entity = addEntity(world);
  addComponent(world, MonsterSpawnComponent, entity);
  MonsterSpawnComponent.lastTriggeredMilestone0[entity] = 0;
  MonsterSpawnComponent.lastTriggeredMilestone1[entity] = 0;
  MonsterSpawnComponent.lastTriggeredMilestone2[entity] = 0;
  MonsterSpawnComponent.lastTriggeredMilestone3[entity] = 0;
  return entity;
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
