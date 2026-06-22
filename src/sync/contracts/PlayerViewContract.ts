export interface IPlayerHUD {
  setMoney(value: number): void;
  setAngry(value: number): void;
  setPower(value: number, max: number): void;
  setLevel(value: number): void;
}
