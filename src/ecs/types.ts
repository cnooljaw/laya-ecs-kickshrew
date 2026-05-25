/** 地鼠类型 */
export const enum ShrewType {
  Red = 1,
  Blue = 2,
  Yellow = 3,
  Green = 4,
}

/** 地鼠动作状态 */
export const enum ShrewAction {
  None = 1,
  Wait = 2,
  Up = 3,
  Down = 4,
  Stand = 5,
  Dizzy = 6,
  Refresh = 7,
  Delay = 8,
  Max = 9,
  Sleep = 10,
}

/** 地图类型 */
export const enum MapType {
  None = 1,
  Meadow = 2,
  Ship = 3,
  Sewer = 4,
  Space = 5,
  Max = 6,
}

/** 锤子类型 */
export const enum HammerType {
  Wood = 1,
  Stone = 2,
  Copper = 3,
  Silver = 4,
  Gold = 5,
  God = 6,
  Thunder = 99,
}

/** 各肢体渲染 ZOrder */
export const enum ZOrder {
  hand = 0,
  ear = 1,
  props2 = 2,
  body = 3,
  frontear = 4,
  frontHand = 5,
  face = 6,
  eyes = 7,
  mouth = 8,
  props3 = 9,
  hat = 10,
  dizzyProps = 11,
  props = 12,
  dizzyProps2 = 13,
  afterPropHand = 14,
  swelling = 15,
  swellingEffect = 16,
  dizzyStars = 17,
  number = 18,
}

/** 动画类型 */
export const enum AnimType {
  Idle = 0,
  Up = 1,
  Stand = 2,
  Down = 3,
  Dizzy = 4,
  HatBreak = 5,
  Swelling = 6,
  HammerEffect = 7,
  ComboLightning = 8,
  TreasureBox = 9,
}

/** 洞位数量 */
export const HOLE_COUNT = 9;

/** 地鼠网格行/列 */
export const GRID_SIZE = 3;
