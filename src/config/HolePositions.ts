import { MapType } from "../ecs/types";

/**
 * 洞位比例坐标（Laya 屏幕空间，960x640），表示地鼠出洞的视觉锚点。
 *
 * 来源：src1/ Lua 代码中 holePositionX/Y 基于 bg(1136x640) 的比例
 * Cocos 中 bg(1136x640) 居中在 960x640 屏幕上，左右各超 88px
 * X 转换：layaXRatio = (luaXRatio * 1136 - 88) / 960
 * Y 转换：layaYRatio = 1 - luaYRatio（Cocos Y-up → Laya Y-down，高度相同无需缩放）
 *
 * 草地场景已按当前 Laya 草地背景的洞口椭圆中心二次校准。
 */
export const HolePositions: Record<number, { xRatios: number[]; yRatios: number[] }> = {
  [MapType.Meadow]: {
    xRatios: [0.2852, 0.4950, 0.7136, 0.2722, 0.5023, 0.7333, 0.2642, 0.5055, 0.7503],
    yRatios: [0.3427, 0.3427, 0.3427, 0.5297, 0.5297, 0.5297, 0.7393, 0.7393, 0.7393],
  },
  [MapType.Ship]: {
    xRatios: [0.2468, 0.4976, 0.7544, 0.2349, 0.5,    0.7745, 0.2219, 0.5,    0.7899],
    yRatios: [0.45,   0.45,   0.45,   0.635,  0.635,  0.635,  0.85,   0.85,   0.85],
  },
  [MapType.Space]: {
    xRatios: [0.2458, 0.4956, 0.752,  0.2338, 0.5,    0.7745, 0.2196, 0.5059, 0.7899],
    yRatios: [0.445,  0.445,  0.445,  0.635,  0.635,  0.635,  0.845,  0.845,  0.845],
  },
};

/** 洞位 index(0~8) → gridRow/gridCol 映射 */
export function getHoleGrid(index: number): { row: number; col: number } {
  return {
    row: Math.floor(index / 3),
    col: index % 3,
  };
}

/** 洞位行 → zOrder（所有场景统一：hole(z=2,4,6), cover(z=3,5,7)） */
export function getHoleZOrder(row: number): number {
  return (row + 1) * 2; // row0=2, row1=4, row2=6
}
