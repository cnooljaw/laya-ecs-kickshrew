import { describe, expect, it } from "vitest";
import { ViewRegistry } from "../../view/ViewRegistry";

describe("ViewRegistry", () => {
  it("clear destroys owned resources in reverse order and is idempotent", () => {
    const registry = new ViewRegistry();
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

    registry.own(node);
    registry.own(resource);

    registry.clear();
    registry.clear();

    expect(destroyed).toEqual(["resource", "node"]);
  });
});
