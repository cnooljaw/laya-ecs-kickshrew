import { AnimationComponent, ShrewComponent } from "../../ecs/components";
import { AnimType, ShrewAction } from "../../ecs/types";
import {
  BIT_ANIM_DURATION,
  BIT_ANIM_PROGRESS,
  BIT_ANIM_TYPE,
  BIT_SHREW_ACTION,
  BIT_SHREW_CLICKABLE,
  BIT_SHREW_HAT,
  BIT_SHREW_HP,
  BIT_SHREW_MAP,
  BIT_SHREW_PROP,
  BIT_SHREW_TIMER,
  BIT_SHREW_TYPE,
} from "../DirtyFlags";
import type { IShrewNode } from "../../binding/ShrewViewBinding";
import { animTypeName, consoleHitTraceLogger } from "../../debug/HitTraceLogger";
import {
  createRule,
  defineViewRules,
  noView,
  type ViewBindingRule,
  type ViewRuleContext,
  type ViewRuleRow,
} from "./ViewBindingRule";
export { applyMatchedRules, bitsOf, createRule, noView, row, toDirtyMarks } from "./ViewBindingRule";

type ComponentField = Extract<keyof typeof ShrewComponent, string>;
type AnimationField = Extract<keyof typeof AnimationComponent, string>;
const shrewRule = createRule<IShrewNode, ComponentField>();
const animationRule = createRule<IShrewNode, AnimationField>();

interface ShrewRuleContext extends ViewRuleContext<IShrewNode> {
  source?: string;
}

type ShrewViewRule<TField extends string = string> = ViewBindingRule<IShrewNode, TField>;

export function defineShrewViewRules(rows: readonly ViewRuleRow<IShrewNode, ComponentField>[]): ShrewViewRule<ComponentField>[] {
  return defineViewRules("ShrewComponent", ShrewComponent, rows);
}

function applySpriteFrame({ eid, node }: ShrewRuleContext): void {
  node.setSpriteFrame(ShrewComponent.shrewType[eid], ShrewComponent.mapType[eid]);
}

function applyAnimation({ eid, node, source }: ShrewRuleContext): void {
  if (ShrewComponent.actionState[eid] === ShrewAction.Dizzy) {
    consoleHitTraceLogger.log("binding.dizzyAnimation", {
      eid,
      source: source ?? "shrewRule",
      actionState: ShrewComponent.actionState[eid],
      animType: AnimationComponent.animType[eid],
      animTypeName: animTypeName(AnimationComponent.animType[eid]),
      progress: AnimationComponent.progress[eid],
      isDizzyAnim: AnimationComponent.animType[eid] === AnimType.Dizzy,
    });
  }
  node.setAnimation(
    ShrewComponent.actionState[eid],
    AnimationComponent.animType[eid],
    AnimationComponent.progress[eid],
  );
}

function applyClickable({ eid, node }: ShrewRuleContext): void {
  node.setClickable(ShrewComponent.isClickable[eid] === 1);
}

function applyHatVisible({ eid, node }: ShrewRuleContext): void {
  node.setHatVisible(ShrewComponent.hasHat[eid] === 1);
}

function applyPropType({ eid, node }: ShrewRuleContext): void {
  node.setPropType(ShrewComponent.propType[eid]);
}

export const SHREW_COMPONENT_RULES = defineShrewViewRules([
  // bit                   label          fields             apply
  shrewRule(BIT_SHREW_TYPE,      "地鼠类型",    ["shrewType"],     applySpriteFrame),
  shrewRule(BIT_SHREW_HP,        "地鼠生命值",  ["hp"],            noView),
  shrewRule(BIT_SHREW_ACTION,    "动作状态",    ["actionState"],   applyAnimation),
  shrewRule(BIT_SHREW_HAT,       "帽子显示",    ["hasHat"],        applyHatVisible),
  shrewRule(BIT_SHREW_MAP,       "地图皮肤",    ["mapType"],       applySpriteFrame),
  shrewRule(BIT_SHREW_CLICKABLE, "是否可点击",  ["isClickable"],   applyClickable),
  shrewRule(BIT_SHREW_TIMER,     "状态计时器",  ["animTimer"],     noView),
  shrewRule(BIT_SHREW_PROP,      "道具类型",    ["propType"],      applyPropType),
]);

export const SHREW_ANIMATION_RULES = defineViewRules<IShrewNode, AnimationField>(
  "AnimationComponent",
  AnimationComponent,
[
  // bit                 label       fields        apply
  animationRule(BIT_ANIM_TYPE,     "动画类型", ["animType"], applyAnimation),
  animationRule(BIT_ANIM_PROGRESS, "动画进度", ["progress"], applyAnimation),
  animationRule(BIT_ANIM_DURATION, "动画时长", ["duration"], applyAnimation),
]);
