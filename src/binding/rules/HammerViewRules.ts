import { HammerComponent } from "../../ecs/components";
import {
  BIT_HAMMER_HITTABLE,
  BIT_HAMMER_THUNDER,
  BIT_HAMMER_TYPE,
} from "../DirtyFlags";
import type { IHammerNode } from "../HammerViewBinding";
import { defineViewRules, noView, row } from "./ViewBindingRule";

type HammerField = Extract<keyof typeof HammerComponent, string>;

function applyHammerType({ eid, node }: { eid: number; node: IHammerNode }): void {
  node.setHammerType(HammerComponent.selectedType[eid]);
}

function applyThunderActive({ eid, node }: { eid: number; node: IHammerNode }): void {
  node.setThunderActive(HammerComponent.isThunderActive[eid] === 1);
}

export const HAMMER_VIEW_RULES = defineViewRules<IHammerNode, HammerField>(
  "HammerComponent",
  HammerComponent,
  [
    // bit                    label          fields              apply
    row<IHammerNode, HammerField>(BIT_HAMMER_TYPE,     "当前锤子类型", ["selectedType"],    applyHammerType),
    row<IHammerNode, HammerField>(BIT_HAMMER_THUNDER,  "雷神锤状态",   ["isThunderActive"], applyThunderActive),
    row<IHammerNode, HammerField>(BIT_HAMMER_HITTABLE, "是否可击打",   ["hitTable"],        noView),
  ],
);
