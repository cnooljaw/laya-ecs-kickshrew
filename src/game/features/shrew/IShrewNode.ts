export interface IShrewNode {
  setPosition(xRatio: number, yRatio: number): void;
  setSpriteFrame(shrewType: number, mapType: number): void;
  setAnimation(actionState: number, animType: number, progress: number): void;
  setClickable(clickable: boolean): void;
  setHatVisible(visible: boolean): void;
  setPropType(propType: number): void;
  setZOrder(z: number): void;
}
