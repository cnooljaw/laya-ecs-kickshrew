import { afterEach, describe, expect, it, vi } from "vitest";
import { MonsterNode } from "../../../../game/features/monster/MonsterNode";

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
    expect(skeletons[0].playCalls).toBe(1);
  });
});
