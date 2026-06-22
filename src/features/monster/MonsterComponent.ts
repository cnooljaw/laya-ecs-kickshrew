import { defineComponent, Types } from "bitecs";

export const MonsterComponent = defineComponent({
  monsterType: Types.f32,
  posX: Types.f32,
  posY: Types.f32,
  scale: Types.f32,
  visible: Types.f32,
  ageSec: Types.f32,
  durationSec: Types.f32,
  spawnSeq: Types.f32,
});

export const MonsterSpawnComponent = defineComponent({
  lastTriggeredMilestone0: Types.f32,
  lastTriggeredMilestone1: Types.f32,
  lastTriggeredMilestone2: Types.f32,
  lastTriggeredMilestone3: Types.f32,
});
