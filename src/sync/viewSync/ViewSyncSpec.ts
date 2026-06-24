import { field } from "../dirty/DirtyField";
import type { DirtyField, DirtyMark } from "../dirty/DirtySchemaTypes";

export interface ViewSyncContext<TNode> {
  eid: number;
  node: TNode;
  source?: string;
}

export type ViewSyncApply<TNode> = (ctx: ViewSyncContext<TNode>) => void;

export interface ViewSyncRow<TNode, TField extends string> {
  bit: number;
  label: string;
  fields: readonly TField[];
  apply: ViewSyncApply<TNode>;
}

export interface ViewSyncSpecRow<TNode, TField extends string = string> extends ViewSyncRow<TNode, TField> {
  dirtyFields: DirtyField[];
}

export type ViewSyncSpec<TNode, TField extends string = string> = readonly ViewSyncSpecRow<TNode, TField>[];

export function row<TNode, TField extends string>(
  bit: number,
  label: string,
  fields: readonly TField[],
  apply: ViewSyncApply<TNode>,
): ViewSyncRow<TNode, TField> {
  return { bit, label, fields, apply };
}

export function createSyncRow<TNode, TField extends string>() {
  return (
    bit: number,
    label: string,
    fields: readonly TField[],
    apply: ViewSyncApply<TNode>,
  ): ViewSyncRow<TNode, TField> => row(bit, label, fields, apply);
}

export function defineViewSyncSpec<TNode, TField extends string>(
  componentName: string,
  component: Record<TField, ArrayLike<number>>,
  rows: readonly ViewSyncRow<TNode, TField>[],
): ViewSyncSpec<TNode, TField> {
  return rows.map(rule => ({
    ...rule,
    dirtyFields: rule.fields.map(fieldName => field(`${componentName}.${fieldName}`, component[fieldName])),
  }));
}

export function toDirtyMarks(spec: ViewSyncSpec<any>): DirtyMark[] {
  return spec.map(rule => ({
    bit: rule.bit,
    label: rule.label,
    fields: rule.dirtyFields,
  }));
}

export function bitsOf(spec: ViewSyncSpec<any>): number {
  let bits = 0;
  for (let i = 0; i < spec.length; i++) {
    bits |= spec[i].bit;
  }
  return bits;
}

export function applyMatchedViewSyncSpec<TNode>(
  spec: ViewSyncSpec<TNode>,
  ctx: ViewSyncContext<TNode> & { dirtyBits: number; forceFull: boolean },
): void {
  for (let i = 0; i < spec.length; i++) {
    const rule = spec[i];
    if (!ctx.forceFull && (ctx.dirtyBits & rule.bit) === 0) continue;
    if (rule.apply === noProjection || hasMatchedPreviousApply(spec, i, rule.apply, ctx)) continue;
    rule.apply(ctx);
  }
}

export const noProjection: ViewSyncApply<any> = () => {};

function hasMatchedPreviousApply<TNode>(
  spec: ViewSyncSpec<TNode>,
  currentIndex: number,
  apply: ViewSyncApply<TNode>,
  ctx: { dirtyBits: number; forceFull: boolean },
): boolean {
  for (let i = 0; i < currentIndex; i++) {
    const previous = spec[i];
    if (previous.apply !== apply) continue;
    if (ctx.forceFull || (ctx.dirtyBits & previous.bit) !== 0) return true;
  }
  return false;
}
