import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PERF_HERO_RESOURCES,
} from "../../../../game/features/perfHero";
import { PerfHeroNode } from "../../../../game/features/perfHero/PerfHeroNode";

class FakeSprite {
  name = "";
  zOrder = 0;
  x = 0;
  y = 0;
  scaleX = 1;
  scaleY = 1;
  visible = true;
  parent: FakeSprite | null = null;
  children: unknown[] = [];
  destroyed = false;

  addChild(child: any): any {
    this.children.push(child);
    child.parent = this;
    return child;
  }

  removeChild(child: any): void {
    this.children = this.children.filter(item => item !== child);
    child.parent = null;
  }

  destroy(): void {
    this.destroyed = true;
    for (const child of this.children) {
      (child as { destroy?: () => void }).destroy?.();
    }
    this.children = [];
  }
}

class FakeSkeleton extends FakeSprite {
  readonly playCalls: Array<{ index: number; loop: boolean }> = [];
  readonly parentVisibleWhenPlay: boolean[] = [];
  destroyCalls = 0;
  offAllCalls = 0;
  stopCalls = 0;
  private _stoppedCaller: unknown = null;
  private _stoppedHandler: (() => void) | null = null;

  play(index: number, loop: boolean): void {
    this.playCalls.push({ index, loop });
    this.parentVisibleWhenPlay.push(this.parent?.visible ?? false);
  }

  stop(): void {
    this.stopCalls++;
  }

  on(_event: string, caller: unknown, handler: () => void): void {
    this._stoppedCaller = caller;
    this._stoppedHandler = handler;
  }

  offAll(): void {
    this.offAllCalls++;
  }

  removeSelf(): void {
    this.parent?.removeChild(this);
  }

  emitStopped(): void {
    this._stoppedHandler?.call(this._stoppedCaller);
  }

  override destroy(): void {
    this.destroyCalls++;
    this.removeSelf();
  }
}

describe("PerfHeroNode", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("按英雄资源池化 Skeleton，重生时复用实例而不是销毁重建", async () => {
    const created = new Map<string, FakeSkeleton[]>();
    const templetByUrl = new Map<string, { buildArmature: () => FakeSkeleton }>();
    for (const resource of PERF_HERO_RESOURCES) {
      created.set(resource.skUrl, []);
      templetByUrl.set(resource.skUrl, {
        buildArmature: () => {
          const skeleton = new FakeSkeleton();
          created.get(resource.skUrl)?.push(skeleton);
          return skeleton;
        },
      });
    }

    const Laya = {
      Sprite: FakeSprite,
      Event: { STOPPED: "stopped" },
      loader: {
        load: (url: string) => Promise.resolve(templetByUrl.get(url)),
      },
    };
    vi.stubGlobal("window", { Laya });

    const node = new PerfHeroNode();
    const parent = new FakeSprite();
    const warlockUrl = PERF_HERO_RESOURCES[0].skUrl;
    const rangerUrl = PERF_HERO_RESOURCES[1].skUrl;

    node.create(parent);
    node.setTransform(10, 20, 0.3);
    node.playHero(0, 1);
    await flushPromises();

    const warlock = created.get(warlockUrl)?.[0];
    expect(warlock).toBeTruthy();
    expect(created.get(warlockUrl)).toHaveLength(1);
    expect(warlock?.playCalls).toHaveLength(1);
    expect(warlock?.parentVisibleWhenPlay).toEqual([false]);

    warlock?.emitStopped();
    node.setTransform(30, 40, 0.4);
    node.playHero(0, 2);
    await flushPromises();

    expect(created.get(warlockUrl)).toHaveLength(1);
    expect(warlock?.playCalls).toHaveLength(2);
    expect(warlock?.parentVisibleWhenPlay).toEqual([false, false]);
    expect(warlock?.destroyCalls).toBe(0);

    warlock?.emitStopped();
    node.setTransform(50, 60, 0.5);
    node.playHero(1, 3);
    await flushPromises();

    const ranger = created.get(rangerUrl)?.[0];
    expect(ranger).toBeTruthy();
    expect(created.get(rangerUrl)).toHaveLength(1);
    expect(warlock?.visible).toBe(false);
    expect(warlock?.destroyCalls).toBe(0);
    expect(ranger?.playCalls).toHaveLength(1);

    ranger?.emitStopped();
    node.setTransform(70, 80, 0.35);
    node.playHero(0, 4);
    await flushPromises();

    expect(created.get(warlockUrl)).toHaveLength(1);
    expect(warlock?.visible).toBe(true);
    expect(warlock?.playCalls).toHaveLength(3);
    expect(ranger?.visible).toBe(false);
    expect(ranger?.destroyCalls).toBe(0);

    node.destroy();

    expect(warlock?.destroyCalls).toBe(1);
    expect(ranger?.destroyCalls).toBe(1);
  });

  it("准备复用 Spine 时先保持隐藏，避免进场瞬间显示上一帧状态", async () => {
    const created: FakeSkeleton[] = [];
    const skUrl = PERF_HERO_RESOURCES[2].skUrl;
    const Laya = {
      Sprite: FakeSprite,
      Event: { STOPPED: "stopped" },
      loader: {
        load: () => Promise.resolve({
          buildArmature: () => {
            const skeleton = new FakeSkeleton();
            created.push(skeleton);
            return skeleton;
          },
        }),
      },
    };
    vi.stubGlobal("window", { Laya });

    const node = new PerfHeroNode();
    const parent = new FakeSprite();
    node.create(parent);
    const container = parent.children[0] as FakeSprite;

    expect(container.visible).toBe(false);

    node.setTransform(10, 20, 0.3);
    node.playHero(2, 1);
    expect(container.visible).toBe(false);
    await flushPromises();

    const skeleton = created[0];
    expect(container.visible).toBe(true);
    expect(skeleton.parentVisibleWhenPlay).toEqual([false]);

    skeleton.emitStopped();
    expect(container.visible).toBe(false);

    node.setTransform(30, 40, 0.4);
    node.playHero(2, 2);
    await flushPromises();

    expect(container.visible).toBe(true);
    expect(skeleton.parentVisibleWhenPlay).toEqual([false, false]);
  });

  it("当前动画仍可见时延后应用下一次重生，避免容器坐标瞬移", async () => {
    const created: FakeSkeleton[] = [];
    const skUrl = "resources/heros/test-no-teleport.sk";
    const Laya = {
      Sprite: FakeSprite,
      Event: { STOPPED: "stopped" },
      loader: {
        load: () => Promise.resolve({
          buildArmature: () => {
            const skeleton = new FakeSkeleton();
            created.push(skeleton);
            return skeleton;
          },
        }),
      },
    };
    vi.stubGlobal("window", { Laya });

    const node = new PerfHeroNode({
      resources: [{ name: "test-no-teleport", skUrl }],
    });
    const parent = new FakeSprite();
    node.create(parent);
    const container = parent.children[0] as FakeSprite;

    node.setTransform(10, 20, 0.3);
    node.playHero(0, 1);
    await flushPromises();

    const skeleton = created[0];
    expect(container.visible).toBe(true);
    expect(container.x).toBe(10);
    expect(container.y).toBe(20);

    node.setTransform(300, 400, 0.5);
    node.playHero(0, 2);

    expect(container.visible).toBe(true);
    expect(container.x).toBe(10);
    expect(container.y).toBe(20);
    expect(skeleton.playCalls).toHaveLength(1);

    skeleton.emitStopped();

    expect(container.visible).toBe(true);
    expect(container.x).toBe(300);
    expect(container.y).toBe(400);
    expect(skeleton.playCalls).toHaveLength(2);
    expect(skeleton.parentVisibleWhenPlay).toEqual([false, false]);
  });

  it("Spine 加载失败不会永久缓存 rejected promise，下一次重生会重试同 URL", async () => {
    const created: FakeSkeleton[] = [];
    const skUrl = "resources/heros/retry-after-failure.sk";
    const load = vi.fn()
      .mockRejectedValueOnce(new Error("temporary load failure"))
      .mockResolvedValueOnce({
        buildArmature: () => {
          const skeleton = new FakeSkeleton();
          created.push(skeleton);
          return skeleton;
        },
      });
    const Laya = {
      Sprite: FakeSprite,
      Event: { STOPPED: "stopped" },
      loader: { load },
    };
    vi.stubGlobal("window", { Laya });

    const node = new PerfHeroNode({
      resources: [{ name: "retry-after-failure", skUrl }],
    });
    const parent = new FakeSprite();
    node.create(parent);

    node.setTransform(10, 20, 0.3);
    node.playHero(0, 1);
    await flushPromises();

    node.setTransform(10, 20, 0.3);
    node.playHero(0, 2);
    await flushPromises();

    expect(load).toHaveBeenCalledTimes(2);
    expect(created).toHaveLength(1);
    expect(created[0].playCalls).toHaveLength(1);
  });
});

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
