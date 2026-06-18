import { ComboComponent } from "../../ecs/components";
import {
  BIT_COMBO_COUNT,
  BIT_COMBO_ID,
  BIT_COMBO_TARGETS,
} from "../DirtyFlags";
import type { IComboNode } from "../ComboViewBinding";
import { defineViewRules, noView, row } from "./ViewBindingRule";

type ComboField = Extract<keyof typeof ComboComponent, string>;

function applyCombo({ eid, node }: { eid: number; node: IComboNode }): void {
  const count = ComboComponent.comboCount[eid];
  if (count > 0) {
    const targets = [
      ComboComponent.targetHole0[eid],
      ComboComponent.targetHole1[eid],
      ComboComponent.targetHole2[eid],
    ].filter(t => t > 0);
    node.showCombo(count, targets);
  } else {
    node.hideCombo();
  }
}

export const COMBO_VIEW_RULES = defineViewRules<IComboNode, ComboField>(
  "ComboComponent",
  ComboComponent,
  [
    // bit                 label            fields                                  apply
    row<IComboNode, ComboField>(BIT_COMBO_COUNT,   "连击次数",      ["comboCount"],                           applyCombo),
    row<IComboNode, ComboField>(BIT_COMBO_ID,      "连击编号",      ["comboID"],                              noView),
    row<IComboNode, ComboField>(BIT_COMBO_TARGETS, "连击目标洞位",  ["targetHole0", "targetHole1", "targetHole2"], applyCombo),
  ],
);
