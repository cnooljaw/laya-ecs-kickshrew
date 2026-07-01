import { afterEach, describe, expect, it, vi } from "vitest";
import { DESIGN_RESOLUTION } from "../../../../config/GameTuning";
import { MonsterNode } from "../../../../game/features/monster/MonsterNode";
import { MonsterAction } from "../../../../game/features/monster";

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

  play(): void {
    this.playCalls++;
  }

  offAll(): void {}
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
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
    expect(skeletons[0].playCalls).toBe(0);
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

  it("加载后不自动播放 Spine，击败时才播放一次自身动画", async () => {
    const skeletons: FakeSkeleton[] = [];
    const load = vi.fn().mockResolvedValue({
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
      resolveSkUrl: () => "resources/monster/rhino.sk",
    });
    node.create(new FakeSprite());

    node.spawn(1, 1);
    await flushPromises();
    node.playHit(1);
    expect(skeletons[0].playCalls).toBe(0);

    node.playDefeated(1);
    expect(skeletons[0].playCalls).toBe(1);
  });

  it("Drop 动画从目标中心上方落到 BoardPosition 对应位置", () => {
    vi.stubGlobal("window", {
      Laya: {
        Sprite: FakeSprite,
      },
    });
    const parent = new FakeSprite();
    const node = new MonsterNode();
    node.create(parent);
    const container = parent.children[0] as FakeSprite;

    node.setPosition(0.5, 0.6);
    node.setAnimation(MonsterAction.Drop, 0);
    expect(container.x).toBeCloseTo(DESIGN_RESOLUTION.width * 0.5, 3);
    expect(container.y).toBeLessThan(DESIGN_RESOLUTION.height * 0.6);

    node.setAnimation(MonsterAction.Drop, 1);
    expect(container.y).toBeCloseTo(DESIGN_RESOLUTION.height * 0.6, 3);
  });
});
