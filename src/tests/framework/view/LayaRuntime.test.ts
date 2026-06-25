import { afterEach, describe, expect, it, vi } from "vitest";
import { getLaya } from "../../../framework/view/LayaRuntime";

describe("LayaRuntime", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads the current window runtime without caching it", () => {
    expect(getLaya()).toBeNull();

    const first = { version: 1 };
    vi.stubGlobal("window", { Laya: first });
    expect(getLaya()).toBe(first);

    const second = { version: 2 };
    vi.stubGlobal("window", { Laya: second });
    expect(getLaya()).toBe(second);
  });
});
