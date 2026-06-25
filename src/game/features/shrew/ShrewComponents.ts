import { defineComponent, Types } from "bitecs";

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

export const HoleComponent = defineComponent({
  gridRow: Types.f32,
  gridCol: Types.f32,
  posXRatio: Types.f32,
  posYRatio: Types.f32,
  shrewEid: Types.f32,
  zIndex: Types.f32,
});

export const SceneComponent = defineComponent({
  currentMap: Types.f32,
  sceneTimer: Types.f32,
  cycleInterval: Types.f32,
  transitioning: Types.f32,
});

export const AnimationComponent = defineComponent({
  animType: Types.f32,
  progress: Types.f32,
  duration: Types.f32,
});
