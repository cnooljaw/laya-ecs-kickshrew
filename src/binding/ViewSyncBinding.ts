import type { ViewSyncSpec } from "../sync/viewSync/ViewSyncSpec";
import { applyMatchedViewSyncSpec } from "../sync/viewSync/ViewSyncSpec";
import type { BindingFn } from "./SyncView";

export interface ViewNodeRegistry<TNode> {
  register(eid: number, node: TNode): void;
  unregister(eid: number): void;
  get(eid: number): TNode | undefined;
  clear(): void;
}

export function createViewNodeRegistry<TNode>(): ViewNodeRegistry<TNode> {
  const nodeMap = new Map<number, TNode>();
  return {
    register: (eid, node) => {
      if (nodeMap.has(eid)) throw new Error(`View node eid 重复注册: ${eid}`);
      nodeMap.set(eid, node);
    },
    unregister: eid => { nodeMap.delete(eid); },
    get: eid => nodeMap.get(eid),
    clear: () => { nodeMap.clear(); },
  };
}

export function createViewSyncBinding<TNode>(
  registry: ViewNodeRegistry<TNode>,
  spec: ViewSyncSpec<TNode>,
  source?: string,
): BindingFn {
  return (eid: number, dirtyBits: number, forceFull: boolean): void => {
    const node = registry.get(eid);
    if (!node) return;

    applyMatchedViewSyncSpec(spec, { eid, node, dirtyBits, forceFull, source });
  };
}
