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

export function applyMatchedRules<TNode>(
  rules: readonly ViewBindingRule<TNode>[],
  ctx: ViewRuleContext<TNode> & { dirtyBits: number; forceFull: boolean },
): void {
  const applied = new Set<ViewRuleApply<TNode>>();
  for (const rule of rules) {
    if (!ctx.forceFull && (ctx.dirtyBits & rule.bit) === 0) continue;
    if (rule.apply === noView || applied.has(rule.apply)) continue;
    applied.add(rule.apply);
    rule.apply(ctx);
  }
}

export const noView: ViewRuleApply<any> = () => {};
