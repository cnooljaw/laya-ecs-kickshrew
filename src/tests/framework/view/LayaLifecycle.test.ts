import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearTweens,
  destroyChildren,
  destroyNode,
} from "../../../framework/view/LayaLifecycle";

describe("LayaLifecycle", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("clears events before destroying a node", () => {
    const calls: string[] = [];
    destroyNode({
      offAll: () => calls.push("offAll"),
      destroy: () => calls.push("destroy"),
    });
    expect(calls).toEqual(["offAll", "destroy"]);
  });

  it("destroys all owned children", () => {
    const removeChildren = vi.fn();
    destroyChildren({ removeChildren });
    expect(removeChildren).toHaveBeenCalledWith(0, -1, true);
  });

  it("delegates tween cleanup through the current runtime", () => {
    const clearAll = vi.fn();
    const target = {};
    vi.stubGlobal("window", { Laya: { Tween: { clearAll } } });

    clearTweens(target);

    expect(clearAll).toHaveBeenCalledWith(target);
  });
});
