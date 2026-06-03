import { describe, expect, it } from "vitest";
import { getPerfTestRuntimeConfig } from "../../config/PerfTestConfig";

describe("PerfTestConfig", () => {
  it("perf=1 默认启用地鼠加速和 1000 个小瓢虫", () => {
    expect(getPerfTestRuntimeConfig("?perf=1")).toEqual({
      enabled: true,
      shrewFast: true,
      ladybirdCount: 1000,
    });
  });

  it("ladybirds=0 允许只测试地鼠加速", () => {
    expect(getPerfTestRuntimeConfig("?perf=1&ladybirds=0")).toEqual({
      enabled: true,
      shrewFast: true,
      ladybirdCount: 0,
    });
  });
});
