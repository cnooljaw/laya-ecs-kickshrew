import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GameScene } from "../../app/GameScene";
import type { GameLoopPipeline } from "../../app/GameLoopPipeline";
import type { KickInputController } from "../../game/session";
import type { EntityRuntime } from "../../framework/ecs/EntityRuntime";
import type { ProjectionRuntime } from "../../framework/sync/ProjectionRuntime";
import type { EffectRuntime } from "../../framework/sync/EffectRuntime";
import { defineQuery } from "bitecs";
import { HammerComponent } from "../../game/features/hammer/HammerComponents";

interface GameSceneInternals {
  _world: object | null;
  _loopPipeline: GameLoopPipeline | null;
  _kickInput: KickInputController | null;
  _entityRuntime: EntityRuntime | null;
  _projectionRuntime: ProjectionRuntime | null;
  _effectRuntime: EffectRuntime | null;
}

describe("GameScene lifecycle", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        __KICKSHREW_NETWORK_CONFIG__: {
          mode: "mock",
        },
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  });

  it("releases the whole runtime on destroy and tolerates repeated destroy", () => {
    const scene = new GameScene();
    const internals = scene as unknown as GameSceneInternals;

    scene.init();

    expect(internals._world).not.toBeNull();
    expect(internals._loopPipeline).not.toBeNull();
    expect(internals._kickInput).not.toBeNull();
    expect(internals._entityRuntime).not.toBeNull();
    expect(internals._projectionRuntime).not.toBeNull();
    expect(internals._effectRuntime).not.toBeNull();
    expect(Array.from(defineQuery([HammerComponent])(internals._world))).toHaveLength(1);

    scene.destroy();

    expect(internals._world).toBeNull();
    expect(internals._loopPipeline).toBeNull();
    expect(internals._kickInput).toBeNull();
    expect(internals._entityRuntime).toBeNull();
    expect(internals._projectionRuntime).toBeNull();
    expect(internals._effectRuntime).toBeNull();
    expect(() => scene.destroy()).not.toThrow();
  });

  it("creates an independent world for the next scene entry", () => {
    const firstScene = new GameScene();
    const secondScene = new GameScene();
    const first = firstScene as unknown as GameSceneInternals;
    const second = secondScene as unknown as GameSceneInternals;

    firstScene.init();
    const firstWorld = first._world;
    firstScene.destroy();

    secondScene.init();

    expect(firstWorld).not.toBeNull();
    expect(second._world).not.toBe(firstWorld);

    secondScene.destroy();
  });
});
