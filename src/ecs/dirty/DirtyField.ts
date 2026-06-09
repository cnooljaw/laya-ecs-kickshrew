import type { DirtyField, DirtyMark } from "./DirtySchemaTypes";

export function field(path: string, values: ArrayLike<number>): DirtyField {
  return {
    path,
    read: eid => values[eid],
  };
}

export function mark(bit: number, label: string, fields: DirtyField[], viewTarget: string): DirtyMark {
  return {
    bit,
    label,
    fields,
    viewTarget,
  };
}
