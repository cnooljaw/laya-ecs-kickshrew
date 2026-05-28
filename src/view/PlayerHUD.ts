/**
 * PlayerHUD — 玩家信息面板
 * 显示金币、怒气值、体力、等级
 */
import type { IPlayerHUD } from "../binding/PlayerViewBinding";
import { PLAYER_HUD_LAYOUT } from "../config/ViewLayoutConfig";

export class PlayerHUD implements IPlayerHUD {
  private _container: any = null;
  private _moneyText: any = null;
  private _angryText: any = null;
  private _powerText: any = null;
  private _levelText: any = null;

  create(parent: any): void {
    const Laya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
    if (Laya) {
      this._container = new Laya.Sprite();
      this._container.name = "PlayerHUD";
      this._container.zOrder = PLAYER_HUD_LAYOUT.zOrder;
      if (parent) {
        parent.addChild(this._container);
      }

      // 横版布局：左上角纵向排列，字体缩小
      const { colors, fontSize, lineHeight, x, y } = PLAYER_HUD_LAYOUT;

      // 金币
      this._moneyText = new Laya.Text();
      this._moneyText.text = "金币: 0";
      this._moneyText.color = colors.money;
      this._moneyText.fontSize = fontSize;
      this._moneyText.x = x;
      this._moneyText.y = y;
      this._container.addChild(this._moneyText);

      // 怒气
      this._angryText = new Laya.Text();
      this._angryText.text = "怒气: 0";
      this._angryText.color = colors.angry;
      this._angryText.fontSize = fontSize;
      this._angryText.x = x;
      this._angryText.y = y + lineHeight;
      this._container.addChild(this._angryText);

      // 体力
      this._powerText = new Laya.Text();
      this._powerText.text = "体力: 0/0";
      this._powerText.color = colors.power;
      this._powerText.fontSize = fontSize;
      this._powerText.x = x;
      this._powerText.y = y + lineHeight * 2;
      this._container.addChild(this._powerText);

      // 等级
      this._levelText = new Laya.Text();
      this._levelText.text = "Lv.1";
      this._levelText.color = colors.level;
      this._levelText.fontSize = fontSize;
      this._levelText.x = x;
      this._levelText.y = y + lineHeight * 3;
      this._container.addChild(this._levelText);
    }
  }

  setMoney(value: number): void {
    if (this._moneyText) {
      this._moneyText.text = `金币: ${value}`;
    }
  }

  setAngry(value: number): void {
    if (this._angryText) {
      this._angryText.text = `怒气: ${value}`;
    }
  }

  setPower(value: number, max: number): void {
    if (this._powerText) {
      this._powerText.text = `体力: ${value}/${max}`;
    }
  }

  setLevel(value: number): void {
    if (this._levelText) {
      this._levelText.text = `Lv.${value}`;
    }
  }

  destroy(): void {
    if (this._container) {
      this._container.destroy();
      this._container = null;
    }
    this._moneyText = null;
    this._angryText = null;
    this._powerText = null;
    this._levelText = null;
  }
}
