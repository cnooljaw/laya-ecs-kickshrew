import type { IPerfHeroNode } from "../binding/PerfHeroViewBinding";
import { PERF_HERO_VIEW_LAYOUT } from "../config/ViewLayoutConfig";

export class PerfHeroNode implements IPerfHeroNode {
  private static readonly _templetPromises = new Map<string, Promise<any>>();
  private _container: any = null;
  private _skeleton: any = null;
  private _destroyed = false;
  private _lastSpawnSeq = -1;

  create(parent: any): void {
    const Laya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
    if (!Laya) {
      this._container = parent;
      return;
    }

    this._container = new Laya.Sprite();
    this._container.name = "PerfHeroNode";
    this._container.zOrder = PERF_HERO_VIEW_LAYOUT.zOrder;
    if (parent) parent.addChild(this._container);
  }

  playHero(_heroType: number, skUrl: string, x: number, y: number, scale: number, spawnSeq: number): void {
    if (!this._container || spawnSeq === this._lastSpawnSeq) return;
    this._lastSpawnSeq = spawnSeq;
    this._container.x = x;
    this._container.y = y;
    this._container.scaleX = scale;
    this._container.scaleY = scale;
    this._container.visible = true;

    const Laya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
    if (!Laya) return;

    PerfHeroNode._loadTemplet(Laya, skUrl).then((templet: any) => {
      if (this._destroyed || !this._container || !templet || spawnSeq !== this._lastSpawnSeq) return;
      this._playTemplet(Laya, templet);
    });
  }

  destroy(): void {
    this._destroyed = true;
    if (this._skeleton) {
      this._skeleton.offAll();
      this._skeleton.destroy();
      this._skeleton = null;
    }
    if (this._container) {
      this._container.destroy();
      this._container = null;
    }
  }

  private _playTemplet(Laya: any, templet: any): void {
    if (this._skeleton) {
      this._skeleton.offAll();
      this._skeleton.destroy();
      this._skeleton = null;
    }

    const skeleton = templet.buildArmature ? templet.buildArmature(0) : new Laya.Skeleton();
    if (!templet.buildArmature) skeleton.templet = templet;
    skeleton.name = "PerfHeroSkeleton";
    this._container.addChild(skeleton);
    this._skeleton = skeleton;

    skeleton.on(Laya.Event.STOPPED, this, this._hide);
    skeleton.play(0, false);
  }

  private _hide(): void {
    if (this._container) this._container.visible = false;
  }

  private static _loadTemplet(Laya: any, skUrl: string): Promise<any> {
    let promise = PerfHeroNode._templetPromises.get(skUrl);
    if (!promise) {
      promise = Laya.loader.load(skUrl);
      PerfHeroNode._templetPromises.set(skUrl, promise);
    }
    return promise;
  }
}
