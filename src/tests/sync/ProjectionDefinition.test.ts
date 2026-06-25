import { defineComponent, Types } from "bitecs";
import { describe, expect, it } from "vitest";
import {
  defineProjection,
  noProjection,
  projectionSource,
  watch,
} from "../../sync/projection/ProjectionDefinition";

const CounterComponent = defineComponent({
  value: Types.ui32,
  max: Types.ui32,
});

interface CounterView {
  setValue(value: number, max: number): void;
}

describe("ProjectionDefinition", () => {
  it("derives field paths and sequential bits from business rows", () => {
    const source = projectionSource("counter", CounterComponent);
    const applyValue = ({ eid, node }: { eid: number; node: CounterView }) => {
      node.setValue(CounterComponent.value[eid], CounterComponent.max[eid]);
    };

    const projection = defineProjection<CounterView>({
      name: "counter",
      components: [CounterComponent],
      rows: [
        watch(source, ["value", "max"], "counter value", applyValue),
        watch(source, ["max"], "dirty-only max", noProjection),
      ],
    });

    expect(projection.rows.map((row) => row.bit)).toEqual([1, 2]);
    expect(projection.rows[0].fields.map((field) => field.path)).toEqual([
      "counter.value",
      "counter.max",
    ]);
    expect(projection.rows[0].apply).toBe(applyValue);
    expect(projection.rows[1].apply).toBe(noProjection);
  });

  it("rejects rows without watched fields", () => {
    const source = projectionSource("counter", CounterComponent);

    expect(() => defineProjection({
      name: "empty",
      components: [CounterComponent],
      rows: [
        watch(source, [], "empty row", noProjection),
      ],
    })).toThrow("Projection empty row 0 must watch at least one field");
  });

  it("rejects projections with more than 32 dirty rows", () => {
    const source = projectionSource("counter", CounterComponent);
    const rows = Array.from({ length: 33 }, (_, index) => (
      watch(source, ["value"], `row ${index}`, noProjection)
    ));

    expect(() => defineProjection({
      name: "overflow",
      components: [CounterComponent],
      rows,
    })).toThrow("Projection overflow supports at most 32 dirty rows");
  });
});
