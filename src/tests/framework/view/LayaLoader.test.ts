import { afterEach, describe, expect, it, vi } from "vitest";
import { loadSpineTemplate } from "../../../framework/view/LayaLoader";

describe("LayaLoader", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shares one in-flight Spine template request per URL", async () => {
    const template = {};
    const load = vi.fn().mockResolvedValue(template);
    vi.stubGlobal("window", { Laya: { loader: { load } } });

    const first = loadSpineTemplate("resources/shared.sk");
    const second = loadSpineTemplate("resources/shared.sk");

    expect(first).toBe(second);
    await expect(first).resolves.toBe(template);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("removes rejected requests so the next call retries", async () => {
    const template = {};
    const load = vi.fn()
      .mockRejectedValueOnce(new Error("temporary"))
      .mockResolvedValueOnce(template);
    vi.stubGlobal("window", { Laya: { loader: { load } } });

    await expect(loadSpineTemplate("resources/retry.sk")).rejects.toThrow("temporary");
    await expect(loadSpineTemplate("resources/retry.sk")).resolves.toBe(template);

    expect(load).toHaveBeenCalledTimes(2);
  });
});
