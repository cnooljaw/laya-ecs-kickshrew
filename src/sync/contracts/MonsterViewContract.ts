export interface IMonsterNode {
  playMonster(monsterType: number, skUrl: string, pngUrl: string, spawnSeq: number): void;
  setPosition(x: number, y: number): void;
  setScale(scale: number): void;
  setVisible(visible: boolean): void;
}
