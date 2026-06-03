import type { IPerfLadybirdNode } from "../binding/PerfLadybirdViewBinding";
import { PERF_LADYBIRD_VIEW_LAYOUT } from "../config/ViewLayoutConfig";

export class PerfLadybirdNode implements IPerfLadybirdNode {
  private static _texture: any = null;
  private static _texturePromise: Promise<any> | null = null;
  private _sprite: any = null;
  private _destroyed = false;

  create(parent: any): void {
    const Laya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
    if (!Laya) {
      this._sprite = parent;
      return;
    }

    this._sprite = new Laya.Sprite();
    this._sprite.name = "PerfLadybirdNode";
    this._sprite.zOrder = PERF_LADYBIRD_VIEW_LAYOUT.zOrder;
    this._sprite.width = 42;
    this._sprite.height = 34;
    this._sprite.pivotX = 21;
    this._sprite.pivotY = 17;
    if (parent) parent.addChild(this._sprite);

    PerfLadybirdNode._loadTexture(Laya).then((texture: any) => {
      if (this._destroyed || !this._sprite || !texture) return;
      this._sprite.graphics.clear();
      this._sprite.graphics.drawTexture(texture, 0, 0);
    });
  }

  setTransform(x: number, y: number, scale: number, phase: number): void {
    if (!this._sprite) return;
    this._sprite.x = x;
    this._sprite.y = y;
    this._sprite.scaleX = scale * (0.9 + Math.sin(phase * 6) * 0.1);
    this._sprite.scaleY = scale;
    this._sprite.rotation = Math.sin(phase * 2.1) * 8;
  }

  destroy(): void {
    this._destroyed = true;
    if (this._sprite) {
      this._sprite.destroy();
      this._sprite = null;
    }
  }

  private static _loadTexture(Laya: any): Promise<any> {
    if (PerfLadybirdNode._texture) return Promise.resolve(PerfLadybirdNode._texture);
    if (!PerfLadybirdNode._texturePromise) {
      PerfLadybirdNode._texturePromise = Laya.loader.load(PERF_LADYBIRD_VIEW_LAYOUT.textureUrl).then((texture: any) => {
        PerfLadybirdNode._texture = texture;
        return texture;
      });
    }
    return PerfLadybirdNode._texturePromise;
  }
}
