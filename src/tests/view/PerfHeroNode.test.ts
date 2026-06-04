import { afterEach, describe, expect, it, vi } from "vitest";
import { PERF_HERO_RESOURCES } from "../../config/ViewLayoutConfig";
import { PerfHeroNode } from "../../view/PerfHeroNode";

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
  destroyCalls = 0;
  offAllCalls = 0;
  stopCalls = 0;

  play(index: number, loop: boolean): void {
    this.playCalls.push({ index, loop });
  }

  stop(): void {
    this.stopCalls++;
  }

  on(): void {}

  offAll(): void {
    this.offAllCalls++;
  }

  removeSelf(): void {
    this.parent?.removeChild(this);
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
    node.playHero(0, warlockUrl, 10, 20, 0.3, 1);
    await flushPromises();

    const warlock = created.get(warlockUrl)?.[0];
    expect(warlock).toBeTruthy();
    expect(created.get(warlockUrl)).toHaveLength(1);
    expect(warlock?.playCalls).toHaveLength(1);

    node.playHero(0, warlockUrl, 30, 40, 0.4, 2);
    await flushPromises();

    expect(created.get(warlockUrl)).toHaveLength(1);
    expect(warlock?.playCalls).toHaveLength(2);
    expect(warlock?.destroyCalls).toBe(0);

    node.playHero(1, rangerUrl, 50, 60, 0.5, 3);
    await flushPromises();

    const ranger = created.get(rangerUrl)?.[0];
    expect(ranger).toBeTruthy();
    expect(created.get(rangerUrl)).toHaveLength(1);
    expect(warlock?.visible).toBe(false);
    expect(warlock?.destroyCalls).toBe(0);
    expect(ranger?.playCalls).toHaveLength(1);

    node.playHero(0, warlockUrl, 70, 80, 0.35, 4);
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
});

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
