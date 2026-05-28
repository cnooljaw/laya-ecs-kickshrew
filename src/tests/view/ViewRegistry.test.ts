import { describe, expect, it } from "vitest";
import { ViewRegistry } from "../../view/ViewRegistry";

describe("ViewRegistry", () => {
  it("clear 会销毁已注册节点且可重复调用", () => {
    const registry = new ViewRegistry();
    const destroyed: string[] = [];
    const sceneNode = {
      switchScene(): void {},
      setTransitioning(): void {},
      destroy(): void {
        destroyed.push("scene");
      },
    };

    registry.registerSceneLayer(1, sceneNode);
    registry.clear();
    registry.clear();

    expect(destroyed).toEqual(["scene"]);
  });
});
