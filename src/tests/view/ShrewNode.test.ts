import { describe, expect, it } from "vitest";
import { ShrewAction } from "../../ecs/types";
import { getShrewMainLayerY } from "../../view/ShrewNode";

describe("ShrewNode animation positioning", () => {
  const bodyH = 110;
  const standY = -bodyH * 0.5;
  const hiddenY = bodyH * 1.5;

  it("Stand 时 body 中心对齐洞口中心", () => {
    const mainLayerY = getShrewMainLayerY(ShrewAction.Stand, bodyH, 1);

    expect(mainLayerY).toBe(standY);
    expect(mainLayerY + bodyH * 0.5).toBe(0);
  });

  it("Up 从洞口中心下方移动到洞口中心", () => {
    expect(getShrewMainLayerY(ShrewAction.Up, bodyH, 0)).toBe(hiddenY);
    expect(getShrewMainLayerY(ShrewAction.Up, bodyH, 1)).toBe(standY);
  });

  it("Down 从洞口中心移动到洞口中心下方", () => {
    expect(getShrewMainLayerY(ShrewAction.Down, bodyH, 0)).toBe(standY);
    expect(getShrewMainLayerY(ShrewAction.Down, bodyH, 1)).toBe(hiddenY);
  });
});
