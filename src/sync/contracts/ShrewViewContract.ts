export interface IShrewNode {
  setSpriteFrame(shrewType: number, mapType: number): void;
  setAnimation(actionState: number, animType: number, progress: number): void;
  setClickable(clickable: boolean): void;
  setHatVisible(visible: boolean): void;
  setPropType(propType: number): void;
}
