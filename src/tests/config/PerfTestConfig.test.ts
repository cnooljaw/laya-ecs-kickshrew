import { describe, expect, it } from "vitest";
import { getPerfTestRuntimeConfig } from "../../config/PerfTestConfig";

describe("PerfTestConfig", () => {
  it("perf=1 默认启用地鼠加速和英雄 Spine 压测", () => {
    expect(getPerfTestRuntimeConfig("?perf=1")).toEqual({
      enabled: true,
      shrewFast: true,
      heroCount: 80,
    });
  });

  it("heroes=0 允许只测试地鼠加速", () => {
    expect(getPerfTestRuntimeConfig("?perf=1&heroes=0")).toEqual({
      enabled: true,
      shrewFast: true,
      heroCount: 0,
    });
  });
});
