import { defineQuery } from "bitecs";
import { PlayerComponent } from "../playerHud/index";
import { MonsterComponent, MonsterSpawnComponent } from "./MonsterComponents";
import { spawnMonster } from "./MonsterPool";
import { MONSTER_SPAWN_RULES, type MonsterSpawnRule } from "./MonsterRules";
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
  for (let stateIndex = 0; stateIndex < states.length; stateIndex++) {
    const state = states[stateIndex];
    const rule = rules[MonsterSpawnComponent.ruleIndex[state]];
    if (!rule) continue;
    const milestone = currentMilestone(player, rule);
    if (milestone <= MonsterSpawnComponent.lastMilestone[state]) continue;

    MonsterSpawnComponent.lastMilestone[state] = milestone;
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
