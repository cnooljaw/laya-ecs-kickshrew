export type Snapshot = Record<string, number>;

export type DirtyArray = Uint32Array;
export type DirtyTarget = Extract<keyof typeof import("../../ecs/components").DirtyComponent, `${string}Dirty`>;
export type DirtySnapshotStore = Map<string, Map<number, Snapshot>>;

export interface DirtyField {
  path: string;
  read: (eid: number) => number;
}

export interface DirtyMark {
  bit: number;
  label: string;
  fields: DirtyField[];
}

export interface DirtyChannel {
  name: string;
  dirtyTarget: DirtyTarget;
  dirtyArray: DirtyArray;
  allBits: number;
  marks: DirtyMark[];
}

export interface DirtyAspect {
  name: string;
  description: string;
  requires: string[];
  query: (world: any) => ArrayLike<number>;
  channels: DirtyChannel[];
}
