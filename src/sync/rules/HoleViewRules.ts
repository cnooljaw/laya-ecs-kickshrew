import { HoleComponent } from "../../ecs/components";
import {
  BIT_HOLE_POS,
  BIT_HOLE_SHREW,
  BIT_HOLE_ZORDER,
} from "../DirtyFlags";
import type { IHoleNode } from "../../binding/HoleViewBinding";
import { createRule, defineViewRules } from "./ViewBindingRule";

type HoleField = Extract<keyof typeof HoleComponent, string>;
const rule = createRule<IHoleNode, HoleField>();

function applyPosition({ eid, node }: { eid: number; node: IHoleNode }): void {
  node.setPosition(HoleComponent.posXRatio[eid], HoleComponent.posYRatio[eid]);
}

function applyShrewVisible({ eid, node }: { eid: number; node: IHoleNode }): void {
  node.setShrewVisible(HoleComponent.shrewEid[eid]);
}

function applyZOrder({ eid, node }: { eid: number; node: IHoleNode }): void {
  node.setZOrder(HoleComponent.zIndex[eid]);
}

export const HOLE_VIEW_RULES = defineViewRules<IHoleNode, HoleField>(
  "HoleComponent",
  HoleComponent,
  [
    // bit               label            fields                    apply
    rule(BIT_HOLE_POS,    "洞位坐标",      ["posXRatio", "posYRatio"], applyPosition),
    rule(BIT_HOLE_SHREW,  "洞位绑定地鼠",  ["shrewEid"],               applyShrewVisible),
    rule(BIT_HOLE_ZORDER, "洞位层级",      ["zIndex"],                 applyZOrder),
  ],
);
