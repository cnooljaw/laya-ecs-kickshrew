export interface IMonsterNode {
  playDefeated(defeatedSeq: number): void;
  playHit(hitSeq: number): void;
  spawn(monsterType: number, spawnSeq: number): void;
  setPosition(x: number, y: number): void;
  setScale(scale: number): void;
  setZOrder(z: number): void;
  setVisible(visible: boolean): void;
}
