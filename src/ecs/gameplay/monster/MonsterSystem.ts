import { defineQuery } from "bitecs";
import { PlayerComponent } from "../../components";
import { MONSTER_SPAWN_RULES, type MonsterSpawnRule } from "../../../config/MonsterConfig";
import { MonsterComponent, MonsterSpawnComponent } from "./MonsterComponent";
import { spawnMonster } from "./MonsterFactory";
import { MonsterType } from "./MonsterTypes";

const playerQuery = defineQuery([PlayerComponent]);
const monsterQuery = defineQuery([MonsterComponent]);
const monsterSpawnQuery = defineQuery([MonsterSpawnComponent]);

export function monsterSpawnSystem(
  world: any,
  _deltaSec: number = 0,
  rules: readonly MonsterSpawnRule[] = MONSTER_SPAWN_RULES,
): void {
  const players = playerQuery(world);
  const states = monsterSpawnQuery(world);
  if (players.length === 0 || states.length === 0) return;

  const player = players[0];
  const state = states[0];

  for (const rule of rules) {
    const milestone = currentMilestone(player, rule);
    if (milestone <= getLastTriggeredMilestone(state, rule)) continue;

    setLastTriggeredMilestone(state, rule, milestone);
    if (activeCount(world, rule.monsterType) >= rule.maxActiveCount) continue;

    const eid = findInactiveMonster(world, rule.monsterType);
    if (eid <= 0) continue;
    spawnMonster(eid, rule.monsterType);
  }
}

export function monsterLifetimeSystem(world: any, deltaSec: number): void {
  const entities = monsterQuery(world);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    if (MonsterComponent.visible[eid] !== 1) continue;

    const duration = MonsterComponent.durationSec[eid];
    const nextAge = Math.min(duration, MonsterComponent.ageSec[eid] + deltaSec);
    MonsterComponent.ageSec[eid] = nextAge;
    if (nextAge >= duration) {
      MonsterComponent.visible[eid] = 0;
    }
  }
}

function currentMilestone(player: number, rule: MonsterSpawnRule): number {
  const sourceValue = rule.trigger.source === "money" ? PlayerComponent.money[player] : 0;
  if (rule.trigger.mode !== "multiple" || rule.trigger.interval <= 0) return 0;
  return Math.floor(sourceValue / rule.trigger.interval);
}

function getLastTriggeredMilestone(state: number, rule: MonsterSpawnRule): number {
  switch (rule.slot) {
    case 1: return MonsterSpawnComponent.lastTriggeredMilestone1[state];
    case 2: return MonsterSpawnComponent.lastTriggeredMilestone2[state];
    case 3: return MonsterSpawnComponent.lastTriggeredMilestone3[state];
    default: return MonsterSpawnComponent.lastTriggeredMilestone0[state];
  }
}

function setLastTriggeredMilestone(state: number, rule: MonsterSpawnRule, milestone: number): void {
  switch (rule.slot) {
    case 1:
      MonsterSpawnComponent.lastTriggeredMilestone1[state] = milestone;
      break;
    case 2:
      MonsterSpawnComponent.lastTriggeredMilestone2[state] = milestone;
      break;
    case 3:
      MonsterSpawnComponent.lastTriggeredMilestone3[state] = milestone;
      break;
    default:
      MonsterSpawnComponent.lastTriggeredMilestone0[state] = milestone;
      break;
  }
}

function activeCount(world: any, monsterType: MonsterType): number {
  const entities = monsterQuery(world);
  let count = 0;
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    if (MonsterComponent.monsterType[eid] === monsterType && MonsterComponent.visible[eid] === 1) {
      count++;
    }
  }
  return count;
}

function findInactiveMonster(world: any, monsterType: MonsterType): number {
  const entities = monsterQuery(world);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    if (MonsterComponent.monsterType[eid] === monsterType && MonsterComponent.visible[eid] !== 1) {
      return eid;
    }
  }
  return 0;
}
