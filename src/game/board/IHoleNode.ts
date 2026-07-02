export interface IHoleNode {
  setPosition(xRatio: number, yRatio: number): void;
  setOccupant(kind: number, eid: number): void;
  setZOrder(z: number): void;
}
