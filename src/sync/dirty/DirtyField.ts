import type { DirtyField } from "./DirtySchemaTypes";

export function field(path: string, values: ArrayLike<number>): DirtyField {
  return {
    path,
    read: eid => values[eid],
  };
}
