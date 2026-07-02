import { defineComponent, Types } from "bitecs";
export { BoardPositionComponent, HoleComponent, SceneComponent } from "../../board/index";

export const ShrewComponent = defineComponent({
  shrewType: Types.f32,
  holeIndex: Types.f32,
  hp: Types.f32,
  actionState: Types.f32,
  hasHat: Types.f32,
  mapType: Types.f32,
  isClickable: Types.f32,
  blockedByOccupant: Types.f32,
  animTimer: Types.f32,
  propType: Types.f32,
});

export const AnimationComponent = defineComponent({
  animType: Types.f32,
  progress: Types.f32,
  duration: Types.f32,
});
