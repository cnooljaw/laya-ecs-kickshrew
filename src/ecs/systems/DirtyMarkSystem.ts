/**
 * DirtyMarkSystem — 脏标记系统
 *
 * 职责: 比较当前帧与上一帧的组件数据差异，设置 DirtyComponent 的 bitmask。
 * SyncView 读取这些 bitmask 来决定哪些 Laya 节点属性需要更新。
 *
 * 具体的 entity 组件组合、字段、dirty bit 和目标节点方法声明在 ecs/dirty/aspects。
 */
import { DIRTY_ASPECTS } from "../dirty/aspects";
import {
  createDirtySnapshotStore,
  markAspectDirty,
} from "../dirty/DirtySchemaRunner";
import type {
  DirtySnapshotStore,
  DirtyStoreKey,
  Snapshot,
} from "../dirty/DirtySchemaTypes";

const stores = new WeakMap<object, DirtySnapshotStore>();

function getStore(world: object): DirtySnapshotStore {
  let store = stores.get(world);
  if (!store) {
    store = createDirtySnapshotStore();
    stores.set(world, store);
  }
  return store;
}

/**
 * 脏标记系统: 比较前后帧差异，设置 dirty bits
 */
export function dirtyMarkSystem(world: any): void {
  const store = getStore(world);
  for (const aspect of DIRTY_ASPECTS) {
    markAspectDirty(world, store, aspect);
  }
}

export function getDirtySnapshotForTest(
  world: object,
  storeKey: DirtyStoreKey,
  eid: number,
): Snapshot | undefined {
  return stores.get(world)?.[storeKey].get(eid);
}
