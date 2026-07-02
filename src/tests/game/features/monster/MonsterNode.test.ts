import { afterEach, describe, expect, it, vi } from "vitest";
import { DESIGN_RESOLUTION } from "../../../../config/GameTuning";
import { MonsterNode } from "../../../../game/features/monster/MonsterNode";
import { MonsterAction } from "../../../../game/features/monster";
import type { MonsterViewConfig } from "../../../../game/features/monster/MonsterViewConfig";

class FakeSprite {
  name = "";
  zOrder = 0;
  visible = true;
  x = 0;
  y = 0;
  scaleX = 1;
  scaleY = 1;
  children: unknown[] = [];

  addChild(child: unknown): void {
    this.children.push(child);
  }

  destroy(): void {
    this.children = [];
  }
}

class FakeSkeleton extends FakeSprite {
  playCalls = 0;
  stopCalls = 0;
  lastLoop: boolean | undefined;
  height = 120;
  bounds = { x: 0, y: 0, width: 0, height: 0 };

  play(_index = 0, loop = false): void {
    this.playCalls++;
    this.lastLoop = loop;
  }

  getBounds(): { x: number; y: number; width: number; height: number } {
    return this.bounds;
  }

  stop(): void {
    this.stopCalls++;
  }

  offAll(): void {}
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function createViewConfig(visualBounds: MonsterViewConfig["visualBounds"]): MonsterViewConfig {
  return {
    skUrl: "resources/monster/test.sk",
    pngUrl: "resources/monster/test.png",
    posX: 0,
    posY: 0,
    visualBounds,
  };
}

describe("MonsterNode", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("Spine 加载失败不会永久缓存 rejected promise，下一次生成会重试同 URL", async () => {
    const skeletons: FakeSkeleton[] = [];
    const load = vi.fn()
      .mockRejectedValueOnce(new Error("temporary load failure"))
      .mockResolvedValueOnce({
        buildArmature: () => {
          const skeleton = new FakeSkeleton();
          skeletons.push(skeleton);
          return skeleton;
        },
      });

    vi.stubGlobal("window", {
      Laya: {
        Sprite: FakeSprite,
        Skeleton: FakeSkeleton,
        loader: { load },
      },
    });

    const node = new MonsterNode({
      resolveSkUrl: () => "resources/monster/retry.sk",
    });
    const parent = new FakeSprite();
    node.create(parent);

    node.spawn(1, 1);
    await flushPromises();

    node.spawn(1, 2);
    await flushPromises();

    expect(load).toHaveBeenCalledTimes(2);
    expect(skeletons).toHaveLength(1);
    expect(skeletons[0].playCalls).toBe(1);
    expect(skeletons[0].lastLoop).toBe(true);
  });

  it("spawnSeq 为 0 的初始同步不加载 Spine", async () => {
    const load = vi.fn();
    vi.stubGlobal("window", {
      Laya: {
        Sprite: FakeSprite,
        Skeleton: FakeSkeleton,
        loader: { load },
      },
    });

    const node = new MonsterNode({
      resolveSkUrl: () => "resources/monster/rhino.sk",
    });
    node.create(new FakeSprite());

    node.spawn(1, 0);
    await flushPromises();

    expect(load).not.toHaveBeenCalled();
  });

  it("加载后立即播放 Spine 动画，击败时继续播放自身动画", async () => {
    const skeletons: FakeSkeleton[] = [];
    const buildArmature = vi.fn(() => {
      const skeleton = new FakeSkeleton();
      skeletons.push(skeleton);
      return skeleton;
    });
    const load = vi.fn().mockResolvedValue({
      buildArmature,
    });
    vi.stubGlobal("window", {
      Laya: {
        Sprite: FakeSprite,
        Skeleton: FakeSkeleton,
        loader: { load },
      },
    });
    const node = new MonsterNode({
      resolveSkUrl: () => "resources/monster/rhino.sk",
    });
    node.create(new FakeSprite());

    node.spawn(1, 1);
    await flushPromises();
    expect(buildArmature).toHaveBeenCalledWith(2);
    expect(skeletons[0].playCalls).toBe(1);
    expect(skeletons[0].lastLoop).toBe(true);

    node.playHit(1);
    expect(skeletons[0].playCalls).toBe(1);

    node.playDefeated(1);
    expect(skeletons[0].playCalls).toBe(2);
    expect(skeletons[0].lastLoop).toBe(false);
  });

  it("同类型重复 spawn 复用已加载 Skeleton，避免重复销毁重建导致闪烁", async () => {
    const skeleton = new FakeSkeleton();
    const load = vi.fn().mockResolvedValue({
      buildArmature: () => skeleton,
    });
    vi.stubGlobal("window", {
      Laya: {
        Sprite: FakeSprite,
        Skeleton: FakeSkeleton,
        loader: { load },
      },
    });
    const parent = new FakeSprite();
    const node = new MonsterNode({
      resolveSkUrl: () => "resources/monster/reuse-skeleton.sk",
    });
    node.create(parent);

    node.spawn(1, 1);
    await flushPromises();
    expect(load).toHaveBeenCalledTimes(1);
    expect(skeleton.playCalls).toBe(1);

    node.spawn(1, 2);
    await flushPromises();
    expect(load).toHaveBeenCalledTimes(1);
    expect(skeleton.playCalls).toBe(1);

    node.playDefeated(1);
    expect(skeleton.playCalls).toBe(2);
    expect(skeleton.lastLoop).toBe(false);

    node.spawn(1, 3);
    await flushPromises();
    expect(load).toHaveBeenCalledTimes(1);
    expect(skeleton.playCalls).toBe(3);
    expect(skeleton.lastLoop).toBe(true);
  });

  it("Wait 隐藏后再次复用 Skeleton 时从头恢复 loop，避免从隐藏期间的随机帧闪出", async () => {
    const skeleton = new FakeSkeleton();
    const load = vi.fn().mockResolvedValue({
      buildArmature: () => skeleton,
    });
    vi.stubGlobal("window", {
      Laya: {
        Sprite: FakeSprite,
        Skeleton: FakeSkeleton,
        loader: { load },
      },
    });
    const parent = new FakeSprite();
    const node = new MonsterNode({
      resolveSkUrl: () => "resources/monster/reuse-after-wait.sk",
    });
    node.create(parent);
    const container = parent.children[0] as FakeSprite;

    node.spawn(1, 1);
    await flushPromises();
    expect(skeleton.playCalls).toBe(1);

    node.setAnimation(MonsterAction.Wait, 0);
    expect(skeleton.stopCalls).toBe(1);
    expect(container.visible).toBe(false);

    node.setVisible(true);
    node.spawn(1, 2);
    await flushPromises();

    expect(load).toHaveBeenCalledTimes(1);
    expect(skeleton.playCalls).toBe(2);
    expect(skeleton.lastLoop).toBe(true);
    expect(skeleton.stopCalls).toBe(1);
    expect(container.visible).toBe(true);
  });

  it("Drop 动画从屏幕顶部落到 BoardPosition 对应位置", async () => {
    const load = vi.fn().mockResolvedValue({
      buildArmature: () => new FakeSkeleton(),
    });
    vi.stubGlobal("window", {
      Laya: {
        Sprite: FakeSprite,
        Skeleton: FakeSkeleton,
        loader: { load },
      },
    });
    const parent = new FakeSprite();
    const node = new MonsterNode({
      resolveSkUrl: () => "resources/monster/drop-height.sk",
      resolveViewConfig: () => createViewConfig({ x: -20, y: -80, width: 100, height: 200 }),
    });
    node.create(parent);
    const container = parent.children[0] as FakeSprite;
    node.spawn(1, 1);
    await flushPromises();

    node.setPosition(0.5, 0.6);
    node.setAnimation(MonsterAction.Drop, 0);
    expect(container.x + 30).toBeCloseTo(DESIGN_RESOLUTION.width * 0.5, 3);
    expect(container.y + 20).toBeCloseTo(0, 3);

    node.setAnimation(MonsterAction.Drop, 1);
    expect(container.y + 20).toBeCloseTo(DESIGN_RESOLUTION.height * 0.6, 3);
  });

  it("用配置视觉框中心对齐 BoardPosition，并暴露 raw bounds 做调试对照", async () => {
    const skeleton = new FakeSkeleton();
    skeleton.bounds = { x: -300, y: -260, width: 900, height: 560 };
    const visualBounds = { x: -20, y: -80, width: 100, height: 200 };
    const load = vi.fn().mockResolvedValue({
      buildArmature: () => skeleton,
    });
    vi.stubGlobal("window", {
      Laya: {
        Sprite: FakeSprite,
        Skeleton: FakeSkeleton,
        loader: { load },
      },
    });
    const parent = new FakeSprite();
    const node = new MonsterNode({
      resolveSkUrl: () => "resources/monster/center-offset.sk",
      resolveViewConfig: () => createViewConfig(visualBounds),
    });
    node.create(parent);
    const container = parent.children[0] as FakeSprite;

    node.spawn(1, 1);
    await flushPromises();
    node.setPosition(0.5, 0.6);
    node.setAnimation(MonsterAction.Stay, 1);

    const targetX = DESIGN_RESOLUTION.width * 0.5;
    const targetY = DESIGN_RESOLUTION.height * 0.6;
    expect(container.x + visualBounds.x + visualBounds.width * 0.5).toBeCloseTo(targetX, 3);
    expect(container.y + visualBounds.y + visualBounds.height * 0.5).toBeCloseTo(targetY, 3);

    const geometry = node.getDebugGeometry();
    expect(geometry?.containerAnchor).toEqual({ x: container.x, y: container.y });
    expect(geometry?.visualBounds).toEqual({
      x: container.x + visualBounds.x,
      y: container.y + visualBounds.y,
      width: visualBounds.width,
      height: visualBounds.height,
      centerX: targetX,
      centerY: targetY,
    });
    expect(geometry?.rawSkeletonBounds).toEqual({
      x: container.x + skeleton.bounds.x,
      y: container.y + skeleton.bounds.y,
      width: skeleton.bounds.width,
      height: skeleton.bounds.height,
      centerX: container.x + skeleton.bounds.x + skeleton.bounds.width * 0.5,
      centerY: container.y + skeleton.bounds.y + skeleton.bounds.height * 0.5,
    });
  });
});
