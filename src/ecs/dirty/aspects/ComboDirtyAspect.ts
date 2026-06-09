import { defineQuery } from "bitecs";
import { ComboComponent, DirtyComponent } from "../../components";
import {
  BIT_COMBO_ALL,
  BIT_COMBO_COUNT,
  BIT_COMBO_ID,
  BIT_COMBO_TARGETS,
} from "../../../binding/DirtyFlags";
import { field, mark } from "../DirtyField";
import type { DirtyAspect } from "../DirtySchemaTypes";

const comboQuery = defineQuery([ComboComponent, DirtyComponent]);

export const ComboDirtyAspect: DirtyAspect = {
  name: "ComboDirtyAspect",
  description: "拥有 ComboComponent + DirtyComponent 的连击单例 dirty 映射",
  requires: ["ComboComponent", "DirtyComponent"],
  query: comboQuery,
  channels: [
    {
      name: "comboDirty",
      storeKey: "combo",
      dirtyTarget: "comboDirty",
      allBits: BIT_COMBO_ALL,
      marks: [
        mark(BIT_COMBO_COUNT, "连击次数", [
          field("ComboComponent.comboCount", ComboComponent.comboCount),
        ], "ComboNode.setCombo"),
        mark(BIT_COMBO_ID, "连击编号", [
          field("ComboComponent.comboID", ComboComponent.comboID),
        ], "DirtyComponent.comboDirty"),
        mark(BIT_COMBO_TARGETS, "连击目标洞位", [
          field("ComboComponent.targetHole0", ComboComponent.targetHole0),
          field("ComboComponent.targetHole1", ComboComponent.targetHole1),
          field("ComboComponent.targetHole2", ComboComponent.targetHole2),
        ], "ComboNode.setCombo"),
      ],
    },
  ],
};
