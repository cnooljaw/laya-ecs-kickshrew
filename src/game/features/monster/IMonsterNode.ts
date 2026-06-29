export interface IMonsterNode {
  spawn(monsterType: number, spawnSeq: number): void;
  setPosition(x: number, y: number): void;
  setScale(scale: number): void;
  setVisible(visible: boolean): void;
}
