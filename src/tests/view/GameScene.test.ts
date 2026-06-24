import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ViewSyncRuntime } from "../../binding/ViewSyncRuntime";
import { GameScene } from "../../view/GameScene";
import type { GameLoopPipeline } from "../../view/GameLoopPipeline";
import type { KickInputAdapter } from "../../view/KickInputAdapter";

interface GameSceneInternals {
  _world: object | null;
  _viewSyncRuntime: ViewSyncRuntime | null;
  _loopPipeline: GameLoopPipeline | null;
  _kickInput: KickInputAdapter | null;
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
    expect(internals._viewSyncRuntime).not.toBeNull();
    expect(internals._loopPipeline).not.toBeNull();
    expect(internals._kickInput).not.toBeNull();

    scene.destroy();

    expect(internals._world).toBeNull();
    expect(internals._viewSyncRuntime).toBeNull();
    expect(internals._loopPipeline).toBeNull();
    expect(internals._kickInput).toBeNull();
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
