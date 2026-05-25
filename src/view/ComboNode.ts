/**
 * ComboNode — 连击闪电动画
 */
import type { IComboNode } from "../binding/ComboViewBinding";

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
    text.color = "#FFD700";
    text.fontSize = 48;
    text.bold = true;
    text.x = 375;
    text.y = 500;
    text.anchorX = 0.5;
    text.anchorY = 0.5;
    this._container.addChild(text);
    this._lightningSprites.push(text);

    // 1.5秒后隐藏
    Laya.timer.once(1500, this, () => {
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
