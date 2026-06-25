export interface IPerfHeroNode {
  setTransform(x: number, y: number, scale: number): void;
  playHero(heroType: number, spawnSeq: number): void;
}
