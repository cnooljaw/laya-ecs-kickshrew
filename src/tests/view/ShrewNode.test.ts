import { afterEach, describe, expect, it, vi } from "vitest";
import { MapType } from "../../game/board/assembly";
import { ShrewAction, ShrewType } from "../../game/features/shrew/assembly";
import { getShrewClipLayout, getShrewMainLayerLocalY, getShrewMainLayerY, ShrewNode } from "../../game/features/shrew/ShrewNode";

class FakeGraphics {
  clear(): void {}
  drawTexture(): void {}
  drawCircle(): void {}
  drawLine(): void {}
}

class FakeSprite {
  static instances: FakeSprite[] = [];

  name = "";
  visible = true;
  zOrder = 0;
  x = 0;
  y = 0;
  rotation = 0;
  scrollRect: unknown = null;
  graphics = new FakeGraphics();
  children: FakeSprite[] = [];
  removeChildrenCalls: unknown[][] = [];

  constructor() {
    FakeSprite.instances.push(this);
  }

  addChild(child: FakeSprite): void {
    this.children.push(child);
  }

  removeChildren(...args: unknown[]): void {
    this.removeChildrenCalls.push(args);
    this.children = [];
  }

  destroy(): void {
    this.children = [];
  }
}

class FakeRectangle {
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number,
  ) {}
}

function makeAtlas(frameNames: string[]): { frames: Array<{ url: string; width: number; height: number }> } {
  return {
    frames: frameNames.map((name) => ({
      url: `resources/kickshrew/test/${name}`,
      width: name.endsWith("body") ? 94 : 20,
      height: name.endsWith("body") ? 110 : 20,
    })),
  };
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe("ShrewNode animation positioning", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    FakeSprite.instances = [];
  });

  const bodyH = 110;
  const standY = -bodyH * 0.5;
  const hiddenY = bodyH * 0.52;

  it("Stand 时 body 中心对齐洞口中心", () => {
    const mainLayerY = getShrewMainLayerY(ShrewAction.Stand, bodyH, 1);

    expect(mainLayerY).toBe(standY);
    expect(mainLayerY + bodyH * 0.5).toBe(0);
  });

  it("Up 从 cover 内的浅隐藏位移动到洞口中心", () => {
    expect(getShrewMainLayerY(ShrewAction.Up, bodyH, 0)).toBe(hiddenY);
    expect(getShrewMainLayerY(ShrewAction.Up, bodyH, 1)).toBe(standY);
  });

  it("Down 从洞口中心移动到 cover 内的浅隐藏位", () => {
    expect(getShrewMainLayerY(ShrewAction.Down, bodyH, 0)).toBe(standY);
    expect(getShrewMainLayerY(ShrewAction.Down, bodyH, 1)).toBe(hiddenY);
  });

  it("本地裁剪窗口使用正坐标 scrollRect，并把 Stand 位置映射到窗口内", () => {
    const clip = getShrewClipLayout(94, bodyH);
    const standLocalY = getShrewMainLayerLocalY(ShrewAction.Stand, bodyH, 1);
    const hiddenLocalY = getShrewMainLayerLocalY(ShrewAction.Up, bodyH, 0);

    expect(clip.y).toBe(standY);
    expect(clip.height).toBe(bodyH);
    expect(standLocalY).toBe(0);
    expect(hiddenLocalY).toBeGreaterThan(clip.height);
  });

  it("重建地鼠部件时销毁旧子节点，避免长时间切图积累 graphics/GPU 资源", async () => {
    vi.stubGlobal("window", {
      Laya: {
        Sprite: FakeSprite,
        Rectangle: FakeRectangle,
        Loader: { ATLAS: "atlas" },
        loader: {
          load: () => Promise.resolve(makeAtlas([
            "red_body",
            "red_face_smile",
            "red_ear_left_up",
            "red_ear_right_up",
            "red_hand_left",
            "red_hand_right",
          ])),
        },
      },
    });

    const node = new ShrewNode();
    node.create(new FakeSprite());

    node.setSpriteFrame(ShrewType.Red, MapType.Meadow);
    await flushPromises();

    const mainLayer = FakeSprite.instances.find((sprite) => sprite.name === "ShrewMainLayer");
    expect(mainLayer?.removeChildrenCalls[0]).toEqual([0, -1, true]);
  });

  it("被 Monster 占洞时强制隐藏可见中的地鼠容器", () => {
    vi.stubGlobal("window", {
      Laya: {
        Sprite: FakeSprite,
        Rectangle: FakeRectangle,
      },
    });
    const parent = new FakeSprite();
    const node = new ShrewNode();
    node.create(parent);
    const container = parent.children[0];

    node.setAnimation(ShrewAction.Stand, 0, 1);
    expect(container.visible).toBe(true);

    node.setBlockedByOccupant(true);

    expect(container.visible).toBe(false);
  });

  it("旧 setSpriteFrame 异步加载晚返回时不会重建当前地鼠部件", async () => {
    const loads: Array<{ resolve: (atlas: unknown) => void }> = [];
    vi.stubGlobal("window", {
      Laya: {
        Sprite: FakeSprite,
        Rectangle: FakeRectangle,
        Loader: { ATLAS: "atlas" },
        loader: {
          load: () => new Promise(resolve => {
            loads.push({ resolve });
          }),
        },
      },
    });

    const node = new ShrewNode();
    node.create(new FakeSprite());
    const mainLayer = FakeSprite.instances.find((sprite) => sprite.name === "ShrewMainLayer");

    node.setSpriteFrame(ShrewType.Red, MapType.Meadow);
    node.setSpriteFrame(ShrewType.Blue, MapType.Meadow);

    loads[0].resolve(makeAtlas([
      "red_body",
      "red_face_smile",
      "red_ear_left_up",
      "red_ear_right_up",
      "red_hand_left",
      "red_hand_right",
    ]));
    await flushPromises();

    expect(mainLayer?.removeChildrenCalls).toHaveLength(0);
  });
});
