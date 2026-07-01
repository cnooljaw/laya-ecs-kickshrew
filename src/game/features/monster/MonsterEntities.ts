import { defineEntity } from "../../../framework/ecs/EntityDefinition";
import { BoardPositionComponent } from "../board/index";
import { MonsterComponent, MonsterSpawnComponent } from "./MonsterComponents";
import { MonsterAction, type MonsterType } from "./MonsterTypes";

export interface MonsterEntityInput {
  readonly monsterType: MonsterType;
  readonly posX: number;
  readonly posY: number;
  readonly durationSec: number;
}

export const MonsterEntity = defineEntity<MonsterEntityInput>({
  name: "monster",
  components: [MonsterComponent, BoardPositionComponent],
  cardinality: "many",
  initialize: (eid, input) => {
    MonsterComponent.monsterType[eid] = input.monsterType;
    MonsterComponent.posX[eid] = input.posX;
    MonsterComponent.posY[eid] = input.posY;
    MonsterComponent.visible[eid] = 0;
    MonsterComponent.ageSec[eid] = 0;
    MonsterComponent.durationSec[eid] = input.durationSec;
    MonsterComponent.actionState[eid] = MonsterAction.Wait;
    MonsterComponent.stateTimer[eid] = 0;
    MonsterComponent.animationProgress[eid] = 0;
    MonsterComponent.spawnSeq[eid] = 0;
    MonsterComponent.holeA[eid] = -1;
    MonsterComponent.holeB[eid] = -1;
    MonsterComponent.holeC[eid] = -1;
    MonsterComponent.hp[eid] = 0;
    MonsterComponent.hitSeq[eid] = 0;
    MonsterComponent.defeatedSeq[eid] = 0;
    MonsterComponent.reward[eid] = 30;
    BoardPositionComponent.xRatio[eid] = 0;
    BoardPositionComponent.yRatio[eid] = 0;
    BoardPositionComponent.zIndex[eid] = 0;
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
