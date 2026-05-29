import { describe, expect, it } from "vitest";
import { ShrewAction } from "../../ecs/types";
import { getShrewClipLayout, getShrewMainLayerLocalY, getShrewMainLayerY } from "../../view/ShrewNode";

describe("ShrewNode animation positioning", () => {
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
});
