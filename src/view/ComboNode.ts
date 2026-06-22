/**
 * ComboNode — 连击闪电动画
 */
import type { IComboNode } from "../sync/contracts/ComboViewContract";
import { COMBO_VIEW_LAYOUT } from "../config/ViewLayoutConfig";

export class ComboNode implements IComboNode {
  private _container: any = null;
  private _lightningSprites: any[] = [];

  create(parent: any): void {
    const Laya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
    if (Laya) {
      this._container = new Laya.Sprite();
      this._container.name = "ComboNode";
      this._container.zOrder = COMBO_VIEW_LAYOUT.zOrder;
      if (parent) {
        parent.addChild(this._container);
        parent.setChildIndex?.(this._container, parent.numChildren - 1);
      }
    }
  }

  showCombo(count: number, targets: number[]): void {
    if (!this._container) return;
    this._container.visible = true;
    this._container.zOrder = COMBO_VIEW_LAYOUT.zOrder;
    this._container.parent?.setChildIndex?.(this._container, this._container.parent.numChildren - 1);

    // 清除旧的闪电
    for (const sp of this._lightningSprites) {
      sp.destroy();
    }
    this._lightningSprites = [];

    const Laya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
    if (!Laya) return;

    // TODO: 根据 targets（洞位索引）绘制闪电链
    // 目前简化：显示连击数字
    const text = new Laya.Text();
    text.text = `COMBO x${count}`;
    text.color = COMBO_VIEW_LAYOUT.color;
    text.fontSize = COMBO_VIEW_LAYOUT.fontSize;
    text.bold = true;
    text.x = COMBO_VIEW_LAYOUT.x;
    text.y = COMBO_VIEW_LAYOUT.y;
    text.anchorX = COMBO_VIEW_LAYOUT.anchorX;
    text.anchorY = COMBO_VIEW_LAYOUT.anchorY;
    this._container.addChild(text);
    this._lightningSprites.push(text);

    Laya.timer.clear?.(this, this._hideComboTimer);
    Laya.timer.once(COMBO_VIEW_LAYOUT.visibleMs, this, this._hideComboTimer);
  }

  hideCombo(): void {
    if (this._container) {
      this._container.visible = false;
    }
    for (const sp of this._lightningSprites) {
      sp.destroy();
    }
    this._lightningSprites = [];
  }

  destroy(): void {
    const Laya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
    Laya?.timer?.clear?.(this, this._hideComboTimer);
    this.hideCombo();
    if (this._container) {
      this._container.destroy();
      this._container = null;
    }
  }

  private _hideComboTimer(): void {
    this.hideCombo();
  }
}
