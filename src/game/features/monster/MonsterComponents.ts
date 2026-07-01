import { defineComponent, Types } from "bitecs";

export const MonsterComponent = defineComponent({
  monsterType: Types.f32,
  posX: Types.f32,
  posY: Types.f32,
  visible: Types.f32,
  ageSec: Types.f32,
  durationSec: Types.f32,
  actionState: Types.f32,
  stateTimer: Types.f32,
  animationProgress: Types.f32,
  spawnSeq: Types.f32,
  holeA: Types.f32,
  holeB: Types.f32,
  holeC: Types.f32,
  hp: Types.f32,
  hitSeq: Types.f32,
  defeatedSeq: Types.f32,
  reward: Types.f32,
});

export const MonsterSpawnComponent = defineComponent({
  ruleIndex: Types.ui16,
  lastMilestone: Types.ui32,
});
