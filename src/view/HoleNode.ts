/**
 * HoleNode — 洞位容器节点
 * 含裁剪遮罩 + ShrewNode 子节点
 */
import type { IHoleNode } from "../binding/HoleViewBinding";

/** 设计分辨率（横版）*/
const DESIGN_WIDTH = 960;
const DESIGN_HEIGHT = 640;

export class HoleNode implements IHoleNode {
  private _container: any = null;
  private _shrewNode: any = null;
  private _mask: any = null;

  create(parent: any): void {
    const Laya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
    if (Laya) {
      this._container = new Laya.Sprite();
      this._container.name = "HoleNode";
      if (parent) {
        parent.addChild(this._container);
      }
      // mask 暂不启用：空 mask 会遮挡所有子节点
      // 后续可在加载洞口 atlas 后用实际形状做 mask
    } else {
      this._container = parent;
    }
  }

  /** 获取容器，供 ShrewNode 作为父节点 */
  getContainer(): any {
    return this._container;
  }

  setPosition(xRatio: number, yRatio: number): void {
    if (this._container) {
      this._container.x = xRatio * DESIGN_WIDTH;
      this._container.y = yRatio * DESIGN_HEIGHT;
    }
  }

  setShrewVisible(shrewEid: number): void {
    // 由 ShrewViewBinding 直接控制 ShrewNode 的可见性
    // HoleNode 仅负责容器层级
  }

  setZOrder(z: number): void {
    if (this._container) {
      this._container.zOrder = z;
    }
  }

  destroy(): void {
    if (this._container) {
      this._container.destroy();
      this._container = null;
    }
    this._mask = null;
  }
}
