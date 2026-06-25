import { MONSTER_CONFIG } from "../../../config/MonsterConfig";
import { defineEntity } from "../../../framework/ecs/EntityDefinition";
import { MonsterComponent, MonsterSpawnComponent } from "./MonsterComponent";
import type { MonsterType } from "./MonsterTypes";

export const MonsterEntity = defineEntity<MonsterType>({
  name: "monster",
  components: [MonsterComponent],
  cardinality: "many",
  initialize: (eid, monsterType) => {
    const config = MONSTER_CONFIG[monsterType];
    MonsterComponent.monsterType[eid] = monsterType;
    MonsterComponent.posX[eid] = config.posX;
    MonsterComponent.posY[eid] = config.posY;
    MonsterComponent.scale[eid] = config.scale;
    MonsterComponent.visible[eid] = 0;
    MonsterComponent.ageSec[eid] = 0;
    MonsterComponent.durationSec[eid] = config.durationSec;
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
