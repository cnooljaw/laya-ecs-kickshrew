import { defineComponent, Types } from "bitecs";

/** 地鼠组件 */
export const ShrewComponent = defineComponent({
  shrewType: Types.f32,
  hp: Types.f32,
  actionState: Types.f32,
  hasHat: Types.f32,
  mapType: Types.f32,
  isClickable: Types.f32,
  animTimer: Types.f32,
  propType: Types.f32,
});

/** 洞位组件 */
export const HoleComponent = defineComponent({
  gridRow: Types.f32,
  gridCol: Types.f32,
  posXRatio: Types.f32,
  posYRatio: Types.f32,
  shrewEid: Types.f32,
  zIndex: Types.f32,
});

/** 锤子组件(单例) */
export const HammerComponent = defineComponent({
  selectedType: Types.f32,
  isThunderActive: Types.f32,
  hitTable: Types.f32,
  hitCooldownSec: Types.f32,
  touchX: Types.f32,
  touchY: Types.f32,
  hitSeq: Types.ui32,
});

/** 场景组件(单例) */
export const SceneComponent = defineComponent({
  currentMap: Types.f32,
  sceneTimer: Types.f32,
  cycleInterval: Types.f32,
  transitioning: Types.f32,
});

/** 玩家组件(单例) */
export const PlayerComponent = defineComponent({
  money: Types.f32,
  angry: Types.f32,
  power: Types.f32,
  powerTop: Types.f32,
  level: Types.f32,
});

/** 动画组件 */
export const AnimationComponent = defineComponent({
  animType: Types.f32,
  progress: Types.f32,
  duration: Types.f32,
});

/** 调试压测英雄 Spine 组件 */
export const PerfHeroComponent = defineComponent({
  edge: Types.f32,
  heroType: Types.f32,
  posX: Types.f32,
  posY: Types.f32,
  scale: Types.f32,
  ageSec: Types.f32,
  durationSec: Types.f32,
  spawnSeq: Types.f32,
});
