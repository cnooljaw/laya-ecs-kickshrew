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
});

/** 连击组件(单例) */
export const ComboComponent = defineComponent({
  comboCount: Types.f32,
  comboID: Types.f32,
  targetHole0: Types.f32,
  targetHole1: Types.f32,
  targetHole2: Types.f32,
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

/** 击中结果组件 */
export const HitComponent = defineComponent({
  shrewIndex: Types.f32,
  reward: Types.f32,
  wasHit: Types.f32,
});

/** 网络组件(单例) */
export const NetworkComponent = defineComponent({
  connected: Types.f32,
  pendingKick: Types.f32,
});

/** 脏标记组件 */
export const DirtyComponent = defineComponent({
  shrewDirty: Types.f32,
  holeDirty: Types.f32,
  hammerDirty: Types.f32,
  comboDirty: Types.f32,
  sceneDirty: Types.f32,
  playerDirty: Types.f32,
  animDirty: Types.f32,
  hitDirty: Types.f32,
  forceFullSync: Types.f32,
});
