import { MapType, HOLE_COUNT } from "../ecs/types";
export const HolePositions: Record<number, { xRatios: number[]; yRatios: number[] }> = {
  [MapType.Meadow]: {
    xRatios: [0.2855, 0.496,  0.714,  0.275,  0.501,  0.732,  0.2645, 0.5052, 0.749],
    yRatios: [0.44,   0.44,   0.44,   0.63,   0.63,   0.63,   0.838,  0.835,  0.835],
  },
  [MapType.Ship]: {
    xRatios: [0.286,  0.498,  0.715,  0.276,  0.5,    0.732,  0.265,  0.5,    0.745],
    yRatios: [0.45,   0.45,   0.45,   0.635,  0.635,  0.635,  0.85,   0.85,   0.85],
  },
  [MapType.Sewer]: {
    xRatios: [0.285,  0.5,    0.71,   0.271,  0.5,    0.7345, 0.265,  0.505,  0.75],
    yRatios: [0.45,   0.45,   0.45,   0.645,  0.645,  0.645,  0.85,   0.85,   0.85],
  },
  [MapType.Space]: {
    xRatios: [0.2852, 0.4963, 0.713,  0.275,  0.5,    0.732,  0.263,  0.505,  0.745],
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

/** 洞位行 → zOrder（按场景类型）
 *  下水道三明治结构: base_cover(z=2,6,10) < hole(z=3,7,11) < overlay(z=4,8,12)
 *  其他场景: hole(z=2,4,6), cover(z=3,5,7)
 */
export function getHoleZOrder(row: number, mapType: number = -1): number {
  if (mapType === MapType.Sewer) {
    return (row + 1) * 2 + 1; // row0=3, row1=7, row2=11
  }
  return (row + 1) * 2; // row0=2, row1=4, row2=6
}
