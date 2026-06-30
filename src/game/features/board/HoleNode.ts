/**
 * HoleNode — 洞位容器节点
 * 含裁剪遮罩 + ShrewNode 子节点
 */
import { VIEWPORT } from "../../../config/ViewLayoutConfig";
import { destroyNode } from "../../../framework/view/LayaLifecycle";
import { getLaya } from "../../../framework/view/LayaRuntime";
import type { IHoleNode } from "./IHoleNode";

export class HoleNode implements IHoleNode {
  private _container: any = null;
  private _shrewNode: any = null;
  private _mask: any = null;

  create(parent: any): void {
    const Laya = getLaya();
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
      this._container.x = xRatio * VIEWPORT.width;
      this._container.y = yRatio * VIEWPORT.height;
    }
  }

  setOccupant(_kind: number, _eid: number): void {
    // Board 只维护洞位容器层级；具体 occupant view 由对应 Feature 自己投影。
  }

  setZOrder(z: number): void {
    if (this._container) {
      this._container.zOrder = z;
    }
  }

  destroy(): void {
    if (this._container) {
      destroyNode(this._container);
      this._container = null;
    }
    this._mask = null;
  }
}
