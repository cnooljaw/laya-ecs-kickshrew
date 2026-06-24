export interface IHammerNode {
  setHammerType(hammerType: number): void;
  setThunderActive(active: boolean): void;
  followTouch(x: number, y: number): void;
  playHitAnimation(): void;
}
