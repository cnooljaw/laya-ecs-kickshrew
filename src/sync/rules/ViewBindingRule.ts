import { field } from "../../ecs/dirty/DirtyField";
import type { DirtyField, DirtyMark } from "../../ecs/dirty/DirtySchemaTypes";

export interface ViewRuleContext<TNode> {
  eid: number;
  node: TNode;
  source?: string;
}

export type ViewRuleApply<TNode> = (ctx: ViewRuleContext<TNode>) => void;

export interface ViewRuleRow<TNode, TField extends string> {
  bit: number;
  label: string;
  fields: readonly TField[];
  apply: ViewRuleApply<TNode>;
}

export interface ViewBindingRule<TNode, TField extends string = string> extends ViewRuleRow<TNode, TField> {
  dirtyFields: DirtyField[];
}

export function row<TNode, TField extends string>(
  bit: number,
  label: string,
  fields: readonly TField[],
  apply: ViewRuleApply<TNode>,
): ViewRuleRow<TNode, TField> {
  return { bit, label, fields, apply };
}

export function createRule<TNode, TField extends string>() {
  return (
    bit: number,
    label: string,
    fields: readonly TField[],
    apply: ViewRuleApply<TNode>,
  ): ViewRuleRow<TNode, TField> => row(bit, label, fields, apply);
}

export function defineViewRules<TNode, TField extends string>(
  componentName: string,
  component: Record<TField, ArrayLike<number>>,
  rows: readonly ViewRuleRow<TNode, TField>[],
): ViewBindingRule<TNode, TField>[] {
  return rows.map(rule => ({
    ...rule,
    dirtyFields: rule.fields.map(fieldName => field(`${componentName}.${fieldName}`, component[fieldName])),
  }));
}

export function toDirtyMarks(rules: readonly ViewBindingRule<any>[]): DirtyMark[] {
  return rules.map(rule => ({
    bit: rule.bit,
    label: rule.label,
    fields: rule.dirtyFields,
  }));
}

export function bitsOf(rules: readonly ViewBindingRule<any>[]): number {
  let bits = 0;
  for (let i = 0; i < rules.length; i++) {
    bits |= rules[i].bit;
  }
  return bits;
}

export function applyMatchedRules<TNode>(
  rules: readonly ViewBindingRule<TNode>[],
  ctx: ViewRuleContext<TNode> & { dirtyBits: number; forceFull: boolean },
): void {
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    if (!ctx.forceFull && (ctx.dirtyBits & rule.bit) === 0) continue;
    if (rule.apply === noView || hasMatchedPreviousApply(rules, i, rule.apply, ctx)) continue;
    rule.apply(ctx);
  }
}

export const noView: ViewRuleApply<any> = () => {};

function hasMatchedPreviousApply<TNode>(
  rules: readonly ViewBindingRule<TNode>[],
  currentIndex: number,
  apply: ViewRuleApply<TNode>,
  ctx: { dirtyBits: number; forceFull: boolean },
): boolean {
  for (let i = 0; i < currentIndex; i++) {
    const previous = rules[i];
    if (previous.apply !== apply) continue;
    if (ctx.forceFull || (ctx.dirtyBits & previous.bit) !== 0) return true;
  }
  return false;
}
