import { describe, expect, it } from "vitest";
import { defineEffect } from "../../effects/EffectDefinition";
import { createEffectRuntime } from "../../effects/EffectRuntime";

describe("EffectRuntime", () => {
  it("queues typed effects until flush", () => {
    const Effect = defineEffect<{ value: number }>("test");
    const received: number[] = [];
    const runtime = createEffectRuntime();
    runtime.on(Effect, payload => received.push(payload.value));

    runtime.emit(Effect, { value: 7 });
    expect(received).toEqual([]);

    runtime.flush();
    expect(received).toEqual([7]);
  });

  it("uses definition identity instead of global string names", () => {
    const First = defineEffect<number>("same");
    const Second = defineEffect<number>("same");
    const received: number[] = [];
    const runtime = createEffectRuntime();
    runtime.on(First, payload => received.push(payload));

    runtime.emit(Second, 2);
    runtime.emit(First, 1);
    runtime.flush();

    expect(received).toEqual([1]);
  });

  it("clear drops pending effects and handlers", () => {
    const Effect = defineEffect<number>("test");
    const received: number[] = [];
    const runtime = createEffectRuntime();
    runtime.on(Effect, payload => received.push(payload));
    runtime.emit(Effect, 1);

    runtime.clear();
    runtime.flush();
    runtime.emit(Effect, 2);
    runtime.flush();

    expect(received).toEqual([]);
  });
});
