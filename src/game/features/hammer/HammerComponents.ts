import { defineComponent, Types } from "bitecs";

export const HammerComponent = defineComponent({
  selectedType: Types.f32,
  isThunderActive: Types.f32,
  hitTable: Types.f32,
  hitCooldownSec: Types.f32,
  touchX: Types.f32,
  touchY: Types.f32,
  hitSeq: Types.ui32,
});
