import type { ViewBindingRule } from "../sync/rules/ViewBindingRule";
import { applyMatchedRules } from "../sync/rules/ViewBindingRule";
import type { BindingFn } from "./SyncView";

export interface ViewNodeRegistry<TNode> {
  register(eid: number, node: TNode): void;
  unregister(eid: number): void;
  get(eid: number): TNode | undefined;
}

export function createViewNodeRegistry<TNode>(): ViewNodeRegistry<TNode> {
  const nodeMap = new Map<number, TNode>();
  return {
    register: (eid, node) => { nodeMap.set(eid, node); },
    unregister: eid => { nodeMap.delete(eid); },
    get: eid => nodeMap.get(eid),
  };
}

export function createRuleBinding<TNode>(
  registry: ViewNodeRegistry<TNode>,
  rules: readonly ViewBindingRule<TNode>[],
  source?: string,
): BindingFn {
  return (eid: number, dirtyBits: number, forceFull: boolean): void => {
    const node = registry.get(eid);
    if (!node) return;

    applyMatchedRules(rules, { eid, node, dirtyBits, forceFull, source });
  };
}
