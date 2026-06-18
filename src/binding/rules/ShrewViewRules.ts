import { AnimationComponent, ShrewComponent } from "../../ecs/components";
import { AnimType, ShrewAction } from "../../ecs/types";
import { field } from "../../ecs/dirty/DirtyField";
import type { DirtyField, DirtyMark } from "../../ecs/dirty/DirtySchemaTypes";
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
import type { IShrewNode } from "../ShrewViewBinding";
import { animTypeName, consoleHitTraceLogger } from "../../debug/HitTraceLogger";

type ComponentField = Extract<keyof typeof ShrewComponent, string>;
type AnimationField = Extract<keyof typeof AnimationComponent, string>;

export interface ShrewRuleContext {
  eid: number;
  node: IShrewNode;
  source?: string;
}

export type ShrewRuleApply = (ctx: ShrewRuleContext) => void;

interface RuleRow<TField extends string> {
  bit: number;
  label: string;
  fields: readonly TField[];
  apply: ShrewRuleApply;
}

export interface ShrewViewRule<TField extends string = string> extends RuleRow<TField> {
  dirtyFields: DirtyField[];
}

export function row<TField extends string>(
  bit: number,
  label: string,
  fields: readonly TField[],
  apply: ShrewRuleApply,
): RuleRow<TField> {
  return { bit, label, fields, apply };
}

function componentFields<TField extends string>(
  componentName: string,
  component: Record<TField, ArrayLike<number>>,
  fieldNames: readonly TField[],
): DirtyField[] {
  return fieldNames.map(fieldName => field(`${componentName}.${fieldName}`, component[fieldName]));
}

function defineRules<TField extends string>(
  rows: readonly RuleRow<TField>[],
  componentName: string,
  component: Record<TField, ArrayLike<number>>,
): ShrewViewRule<TField>[] {
  return rows.map(rule => ({
    ...rule,
    dirtyFields: componentFields(componentName, component, rule.fields),
  }));
}

export function defineShrewViewRules(rows: readonly RuleRow<ComponentField>[]): ShrewViewRule<ComponentField>[] {
  return defineRules(rows, "ShrewComponent", ShrewComponent);
}

export function defineShrewAnimationRules(rows: readonly RuleRow<AnimationField>[]): ShrewViewRule<AnimationField>[] {
  return defineRules(rows, "AnimationComponent", AnimationComponent);
}

export function toDirtyMarks(rules: readonly ShrewViewRule[]): DirtyMark[] {
  return rules.map(rule => ({
    bit: rule.bit,
    label: rule.label,
    fields: rule.dirtyFields,
  }));
}

export function applyMatchedRules(
  rules: readonly ShrewViewRule[],
  ctx: ShrewRuleContext & { dirtyBits: number; forceFull: boolean },
): void {
  const applied = new Set<ShrewRuleApply>();
  for (const rule of rules) {
    if (!ctx.forceFull && (ctx.dirtyBits & rule.bit) === 0) continue;
    if (rule.apply === noView || applied.has(rule.apply)) continue;
    applied.add(rule.apply);
    rule.apply(ctx);
  }
}

export const noView: ShrewRuleApply = () => {};

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
  row(BIT_SHREW_TYPE,      "地鼠类型",    ["shrewType"],     applySpriteFrame),
  row(BIT_SHREW_HP,        "地鼠生命值",  ["hp"],            noView),
  row(BIT_SHREW_ACTION,    "动作状态",    ["actionState"],   applyAnimation),
  row(BIT_SHREW_HAT,       "帽子显示",    ["hasHat"],        applyHatVisible),
  row(BIT_SHREW_MAP,       "地图皮肤",    ["mapType"],       applySpriteFrame),
  row(BIT_SHREW_CLICKABLE, "是否可点击",  ["isClickable"],   applyClickable),
  row(BIT_SHREW_TIMER,     "状态计时器",  ["animTimer"],     noView),
  row(BIT_SHREW_PROP,      "道具类型",    ["propType"],      applyPropType),
]);

export const SHREW_ANIMATION_RULES = defineShrewAnimationRules([
  // bit                 label       fields        apply
  row(BIT_ANIM_TYPE,     "动画类型", ["animType"], applyAnimation),
  row(BIT_ANIM_PROGRESS, "动画进度", ["progress"], applyAnimation),
  row(BIT_ANIM_DURATION, "动画时长", ["duration"], applyAnimation),
]);
