import { describe, expect, it } from "vitest";
import { createViewSyncBinding, createViewNodeRegistry } from "../../binding/ViewSyncBinding";
import { defineViewSyncSpec, createSyncRow } from "../../sync/viewSync/ViewSyncSpec";

describe("ViewSyncBinding", () => {
  it("拒绝同一 runtime registry 重复注册 eid", () => {
    const registry = createViewNodeRegistry<object>();
    registry.register(1, {});

    expect(() => registry.register(1, {})).toThrow("View node eid 重复注册: 1");
  });

  it("用共享 registry 创建多个 rule binding，并把 source 透传给 apply", () => {
    const calls: Array<{ source: string | undefined; value: number }> = [];
    const component = {
      value: [42],
      progress: [7],
    };
    const rule = createSyncRow<{ setValue(value: number): void }, keyof typeof component>();
    const valueRules = defineViewSyncSpec("TestComponent", component, [
      rule(0x01, "值", ["value"], ({ node, source }) => {
        calls.push({ source, value: component.value[0] });
        node.setValue(component.value[0]);
      }),
    ]);
    const progressRules = defineViewSyncSpec("TestComponent", component, [
      rule(0x02, "进度", ["progress"], ({ node, source }) => {
        calls.push({ source, value: component.progress[0] });
        node.setValue(component.progress[0]);
      }),
    ]);
    const values: number[] = [];
    const registry = createViewNodeRegistry<{ setValue(value: number): void }>();
    const valueBinding = createViewSyncBinding(registry, valueRules, "valueDirty");
    const progressBinding = createViewSyncBinding(registry, progressRules, "progressDirty");

    registry.register(1, { setValue: value => values.push(value) });

    valueBinding(1, 0x01, false);
    progressBinding(1, 0x02, false);
    registry.unregister(1);
    valueBinding(1, 0x01, false);

    expect(values).toEqual([42, 7]);
    expect(calls).toEqual([
      { source: "valueDirty", value: 42 },
      { source: "progressDirty", value: 7 },
    ]);
  });
});
