import { defineEntity } from "../../../framework/ecs/EntityDefinition";
import { MonsterComponent, MonsterSpawnComponent } from "./MonsterComponents";
import type { MonsterType } from "./MonsterTypes";

export interface MonsterEntityInput {
  readonly monsterType: MonsterType;
  readonly posX: number;
  readonly posY: number;
  readonly scale: number;
  readonly durationSec: number;
}

export const MonsterEntity = defineEntity<MonsterEntityInput>({
  name: "monster",
  components: [MonsterComponent],
  cardinality: "many",
  initialize: (eid, input) => {
    MonsterComponent.monsterType[eid] = input.monsterType;
    MonsterComponent.posX[eid] = input.posX;
    MonsterComponent.posY[eid] = input.posY;
    MonsterComponent.scale[eid] = input.scale;
    MonsterComponent.visible[eid] = 0;
    MonsterComponent.ageSec[eid] = 0;
    MonsterComponent.durationSec[eid] = input.durationSec;
    MonsterComponent.spawnSeq[eid] = 0;
  },
});

export const MonsterTriggerEntity = defineEntity<number>({
  name: "monsterTrigger",
  components: [MonsterSpawnComponent],
  cardinality: "many",
  initialize: (eid, ruleIndex) => {
    MonsterSpawnComponent.ruleIndex[eid] = ruleIndex;
    MonsterSpawnComponent.lastMilestone[eid] = 0;
  },
});
