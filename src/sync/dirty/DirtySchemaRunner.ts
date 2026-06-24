import type {
  DirtyAspect,
  DirtyChannel,
  DirtyMark,
  DirtySnapshotStore,
  Snapshot,
} from "./DirtySchemaTypes";

export function createDirtySnapshotStore(): DirtySnapshotStore {
  return new Map();
}

function fillSnapshot(snapshot: Snapshot, eid: number, marks: DirtyMark[]): void {
  for (const mark of marks) {
    for (const field of mark.fields) {
      snapshot[field.path] = field.read(eid);
    }
  }
}

function dirtyBitsAndUpdateSnapshot(snapshot: Snapshot, eid: number, marks: DirtyMark[]): number {
  let dirty = 0;
  for (const mark of marks) {
    for (const field of mark.fields) {
      const nextValue = field.read(eid);
      if (snapshot[field.path] !== nextValue) {
        dirty |= mark.bit;
      }
      snapshot[field.path] = nextValue;
    }
  }
  return dirty;
}

function markChannelDirty(entities: ArrayLike<number>, store: DirtySnapshotStore, channel: DirtyChannel): void {
  let snapshotStore = store.get(channel.name);
  if (!snapshotStore) {
    snapshotStore = new Map();
    store.set(channel.name, snapshotStore);
  }
  const dirtyArray = channel.dirtyArray;

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    let snapshot = snapshotStore.get(eid);
    if (!snapshot) {
      snapshot = {};
      fillSnapshot(snapshot, eid, channel.marks);
      snapshotStore.set(eid, snapshot);
      dirtyArray[eid] = channel.allBits;
    } else {
      dirtyArray[eid] = dirtyBitsAndUpdateSnapshot(snapshot, eid, channel.marks);
    }
  }
}

export function markAspectDirty(world: any, store: DirtySnapshotStore, aspect: DirtyAspect): void {
  const entities = aspect.query(world);
  for (const channel of aspect.channels) {
    markChannelDirty(entities, store, channel);
  }
}
