import { describe, expect, it } from "vitest";
import {
  applyMatchedRules,
  bitsOf,
  createRule,
  defineViewRules,
  type ViewBindingRule,
  type ViewRuleApply,
} from "../../sync/rules/ViewBindingRule";

describe("ViewBindingRule", () => {
  it("applyMatchedRules 对共用 apply 的规则去重且不创建 Set 实例", () => {
    const originalSet = globalThis.Set;
    const createdSets: unknown[] = [];

    class TrackingSet<T> extends originalSet<T> {
      constructor(values?: Iterable<T> | null) {
        super(values ?? undefined);
        createdSets.push(this);
      }
    }

    const calls: string[] = [];
    const applyShared: ViewRuleApply<{ value: number }> = ({ node }) => {
      calls.push(`shared:${node.value}`);
    };
    const applyOther: ViewRuleApply<{ value: number }> = ({ node }) => {
      calls.push(`other:${node.value}`);
    };
    const rule = createRule<{ value: number }, keyof typeof component>();

    const component = {
      a: [0],
      b: [0],
      c: [0],
    };
    const rules: ViewBindingRule<{ value: number }, keyof typeof component>[] = defineViewRules(
      "TestComponent",
      component,
      [
        rule(0x01, "字段 A", ["a"], applyShared),
        rule(0x02, "字段 B", ["b"], applyShared),
        rule(0x04, "字段 C", ["c"], applyOther),
      ],
    );

    try {
      globalThis.Set = TrackingSet as SetConstructor;

      applyMatchedRules(rules, {
        eid: 0,
        node: { value: 7 },
        dirtyBits: 0x03,
        forceFull: false,
      });
    } finally {
      globalThis.Set = originalSet;
    }

    expect(calls).toEqual(["shared:7"]);
    expect(createdSets).toEqual([]);
    expect(bitsOf(rules)).toBe(0x07);
  });
});
