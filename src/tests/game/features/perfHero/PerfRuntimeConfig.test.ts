import { describe, expect, it } from "vitest";
import { getPerfRuntimeConfig } from "../../../../game/features/perfHero";

describe("PerfRuntimeConfig", () => {
  it("perf=1 默认启用地鼠加速和英雄 Spine 压测", () => {
    expect(getPerfRuntimeConfig("?perf=1")).toEqual({
      enabled: true,
      shrewFast: true,
      heroCount: 80,
    });
  });

  it("heroes=0 允许只测试地鼠加速", () => {
    expect(getPerfRuntimeConfig("?perf=1&heroes=0")).toEqual({
      enabled: true,
      shrewFast: true,
      heroCount: 0,
    });
  });
});
