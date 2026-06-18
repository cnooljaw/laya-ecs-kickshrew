import { describe, expect, it } from "vitest";
import { createRuleBinding, createViewNodeRegistry } from "../../binding/RuleViewBinding";
import { defineViewRules, createRule } from "../../sync/rules/ViewBindingRule";

describe("RuleViewBinding", () => {
  it("用共享 registry 创建多个 rule binding，并把 source 透传给 apply", () => {
    const calls: Array<{ source: string | undefined; value: number }> = [];
    const component = {
      value: [42],
      progress: [7],
    };
    const rule = createRule<{ setValue(value: number): void }, keyof typeof component>();
    const valueRules = defineViewRules("TestComponent", component, [
      rule(0x01, "值", ["value"], ({ node, source }) => {
        calls.push({ source, value: component.value[0] });
        node.setValue(component.value[0]);
      }),
    ]);
    const progressRules = defineViewRules("TestComponent", component, [
      rule(0x02, "进度", ["progress"], ({ node, source }) => {
        calls.push({ source, value: component.progress[0] });
        node.setValue(component.progress[0]);
      }),
    ]);
    const values: number[] = [];
    const registry = createViewNodeRegistry<{ setValue(value: number): void }>();
    const valueBinding = createRuleBinding(registry, valueRules, "valueDirty");
    const progressBinding = createRuleBinding(registry, progressRules, "progressDirty");

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
