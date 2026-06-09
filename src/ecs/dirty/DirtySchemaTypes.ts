export type Snapshot = Record<string, number>;

export type DirtyTarget =
  | "shrewDirty"
  | "animDirty"
  | "holeDirty"
  | "hammerDirty"
  | "comboDirty"
  | "sceneDirty"
  | "playerDirty"
  | "hitDirty"
  | "perfHeroDirty";

export interface DirtySnapshotStore {
  shrew: Map<number, Snapshot>;
  anim: Map<number, Snapshot>;
  hole: Map<number, Snapshot>;
  hammer: Map<number, Snapshot>;
  combo: Map<number, Snapshot>;
  scene: Map<number, Snapshot>;
  player: Map<number, Snapshot>;
  hit: Map<number, Snapshot>;
  perfHero: Map<number, Snapshot>;
}

export type DirtyStoreKey = keyof DirtySnapshotStore;

export interface DirtyField {
  path: string;
  read: (eid: number) => number;
}

export interface DirtyMark {
  bit: number;
  label: string;
  fields: DirtyField[];
  viewTarget: string;
}

export interface DirtyChannel {
  name: string;
  storeKey: DirtyStoreKey;
  dirtyTarget: DirtyTarget;
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
