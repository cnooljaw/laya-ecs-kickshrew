import { afterEach, describe, expect, it, vi } from "vitest";
import { createSkeleton } from "../../../framework/view/LayaSpine";

describe("LayaSpine", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("prefers template buildArmature when available", () => {
    const skeleton = {};
    const buildArmature = vi.fn().mockReturnValue(skeleton);

    expect(createSkeleton({ buildArmature }, 2)).toBe(skeleton);
    expect(buildArmature).toHaveBeenCalledWith(2);
  });

  it("falls back to Laya.Skeleton and assigns the template", () => {
    class FakeSkeleton {
      templet: unknown = null;
    }
    vi.stubGlobal("window", { Laya: { Skeleton: FakeSkeleton } });
    const template = {};

    const skeleton = createSkeleton(template);

    expect(skeleton).toBeInstanceOf(FakeSkeleton);
    expect(skeleton.templet).toBe(template);
  });
});
