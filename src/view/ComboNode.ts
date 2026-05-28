/**
 * ComboNode — 连击闪电动画
 */
import type { IComboNode } from "../binding/ComboViewBinding";
import { COMBO_VIEW_LAYOUT } from "../config/ViewLayoutConfig";

export class ComboNode implements IComboNode {
  private _container: any = null;
  private _lightningSprites: any[] = [];

  create(parent: any): void {
    const Laya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
    if (Laya) {
      this._container = new Laya.Sprite();
      this._container.name = "ComboNode";
      if (parent) {
        parent.addChild(this._container);
      }
    }
  }

  showCombo(count: number, targets: number[]): void {
    if (!this._container) return;
    this._container.visible = true;

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

    Laya.timer.once(COMBO_VIEW_LAYOUT.visibleMs, this, () => {
      this.hideCombo();
    });
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
    this.hideCombo();
    if (this._container) {
      this._container.destroy();
      this._container = null;
    }
  }
}
