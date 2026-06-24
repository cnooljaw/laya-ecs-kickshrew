import { describe, expect, it } from "vitest";
import { createViewNodeRegistry } from "../../binding/ViewSyncBinding";
import { ViewRegistry } from "../../view/ViewRegistry";

describe("ViewRegistry", () => {
  it("clear 会反注册、销毁 mount 节点和 own 资源，且可重复调用", () => {
    const registry = new ViewRegistry();
    const nodeRegistry = createViewNodeRegistry<{ destroy(): void }>();
    const destroyed: string[] = [];
    const node = {
      destroy(): void {
        destroyed.push("node");
      },
    };
    const resource = {
      destroy(): void {
        destroyed.push("resource");
      },
    };

    registry.mount(1, node, nodeRegistry);
    registry.own(resource);
    expect(nodeRegistry.get(1)).toBe(node);

    registry.clear();
    registry.clear();

    expect(nodeRegistry.get(1)).toBeUndefined();
    expect(destroyed).toEqual(["resource", "node"]);
  });
});
