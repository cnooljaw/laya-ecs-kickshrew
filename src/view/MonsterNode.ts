import type { IMonsterNode } from "../sync/contracts/MonsterViewContract";

interface MonsterPlayRequest {
  monsterType: number;
  skUrl: string;
  pngUrl: string;
  spawnSeq: number;
}

const templetPromises = new Map<string, Promise<any>>();

export class MonsterNode implements IMonsterNode {
  private _container: any = null;
  private _skeleton: any = null;
  private _destroyed = false;
  private _visible = false;
  private _lastSpawnSeq = -1;

  create(parent: any): void {
    const Laya = runtimeLaya();
    if (!Laya) {
      this._container = parent;
      return;
    }

    this._container = new Laya.Sprite();
    this._container.name = "MonsterNode";
    this._container.zOrder = 80;
    this._container.visible = false;
    parent?.addChild?.(this._container);
  }

  playMonster(monsterType: number, skUrl: string, pngUrl: string, spawnSeq: number): void {
    if (!this._container || spawnSeq === this._lastSpawnSeq) return;
    this._lastSpawnSeq = spawnSeq;
    this._loadAndPlay({ monsterType, skUrl, pngUrl, spawnSeq });
  }

  setPosition(x: number, y: number): void {
    if (!this._container) return;
    this._container.x = x;
    this._container.y = y;
  }

  setScale(scale: number): void {
    if (!this._container) return;
    this._container.scaleX = scale;
    this._container.scaleY = scale;
  }

  setVisible(visible: boolean): void {
    this._visible = visible;
    if (this._container) this._container.visible = visible;
    if (this._skeleton) this._skeleton.visible = visible;
  }

  destroy(): void {
    this._destroyed = true;
    this._skeleton?.offAll?.();
    this._skeleton?.destroy?.();
    this._skeleton = null;
    this._container?.destroy?.();
    this._container = null;
  }

  private async _loadAndPlay(request: MonsterPlayRequest): Promise<void> {
    const Laya = runtimeLaya();
    if (!Laya || !this._container) return;

    try {
      const templet = await loadTemplet(Laya, request.skUrl);
      if (this._destroyed || !this._container || request.spawnSeq !== this._lastSpawnSeq) return;

      this._skeleton?.offAll?.();
      this._skeleton?.destroy?.();
      this._skeleton = templet.buildArmature ? templet.buildArmature(0) : new Laya.Skeleton();
      if (!templet.buildArmature) this._skeleton.templet = templet;
      this._skeleton.name = `MonsterSkeleton:${request.monsterType}`;
      this._skeleton.visible = this._visible;
      this._container.addChild(this._skeleton);
      this._skeleton.play?.(0, true);
    } catch {
      this.setVisible(false);
    }
  }
}

function runtimeLaya(): any {
  return (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
}

function loadTemplet(Laya: any, skUrl: string): Promise<any> {
  let promise = templetPromises.get(skUrl);
  if (!promise) {
    promise = Laya.loader.load(skUrl).catch((error: unknown) => {
      templetPromises.delete(skUrl);
      throw error;
    });
    templetPromises.set(skUrl, promise);
  }
  return promise;
}
