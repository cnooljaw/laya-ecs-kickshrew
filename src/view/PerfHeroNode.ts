import type { IPerfHeroNode } from "../binding/PerfHeroViewBinding";
import { PERF_HERO_RESOURCES, PERF_HERO_VIEW_LAYOUT } from "../config/ViewLayoutConfig";

interface PerfHeroResource {
  name: string;
  skUrl: string;
}

export class PerfHeroSpinePoolGroup {
  private readonly _pools = new Map<string, PerfHeroSpinePool>();

  constructor(resources: readonly PerfHeroResource[] = PERF_HERO_RESOURCES) {
    for (const resource of resources) {
      this._pools.set(resource.skUrl, new PerfHeroSpinePool(resource));
    }
  }

  acquire(Laya: any, heroType: number, skUrl: string): Promise<PooledPerfHeroNode> {
    return this._getPool(skUrl).acquire(Laya, heroType);
  }

  release(instance: PooledPerfHeroNode): void {
    this._getPool(instance.skUrl).release(instance);
  }

  destroy(): void {
    for (const pool of this._pools.values()) {
      pool.destroy();
    }
    this._pools.clear();
  }

  private _getPool(skUrl: string): PerfHeroSpinePool {
    let pool = this._pools.get(skUrl);
    if (!pool) {
      pool = new PerfHeroSpinePool({ name: skUrl, skUrl });
      this._pools.set(skUrl, pool);
    }
    return pool;
  }
}

export class PerfHeroNode implements IPerfHeroNode {
  private readonly _poolGroup: PerfHeroSpinePoolGroup;
  private readonly _ownsPoolGroup: boolean;
  private _container: any = null;
  private _activeHeroNode: PooledPerfHeroNode | null = null;
  private _destroyed = false;
  private _lastSpawnSeq = -1;

  constructor(poolGroup?: PerfHeroSpinePoolGroup) {
    this._poolGroup = poolGroup ?? new PerfHeroSpinePoolGroup();
    this._ownsPoolGroup = !poolGroup;
  }

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

  playHero(heroType: number, skUrl: string, x: number, y: number, scale: number, spawnSeq: number): void {
    if (!this._container || spawnSeq === this._lastSpawnSeq) return;
    this._lastSpawnSeq = spawnSeq;
    this._container.x = x;
    this._container.y = y;
    this._container.scaleX = scale;
    this._container.scaleY = scale;
    this._container.visible = true;

    const Laya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
    if (!Laya) return;

    if (this._activeHeroNode?.skUrl === skUrl) {
      this._activeHeroNode.play(Laya, this, this._hide);
      return;
    }

    this._releaseActiveHeroNode();
    this._poolGroup.acquire(Laya, heroType, skUrl)
      .then((heroNode) => {
        if (this._destroyed || !this._container || spawnSeq !== this._lastSpawnSeq) {
          this._poolGroup.release(heroNode);
          return;
        }

        this._activeHeroNode = heroNode;
        heroNode.attachTo(this._container);
        heroNode.play(Laya, this, this._hide);
      })
      .catch(() => {
        if (this._container && spawnSeq === this._lastSpawnSeq) {
          this._container.visible = false;
        }
      });
  }

  destroy(): void {
    this._destroyed = true;
    this._releaseActiveHeroNode();
    if (this._container) {
      this._container.destroy();
      this._container = null;
    }
    if (this._ownsPoolGroup) {
      this._poolGroup.destroy();
    }
  }

  private _hide(): void {
    if (this._container) this._container.visible = false;
  }

  private _releaseActiveHeroNode(): void {
    if (!this._activeHeroNode) return;
    this._poolGroup.release(this._activeHeroNode);
    this._activeHeroNode = null;
  }
}

class PerfHeroSpinePool {
  private static readonly _templetPromises = new Map<string, Promise<any>>();
  private readonly _idle: PooledPerfHeroNode[] = [];
  private _destroyed = false;

  constructor(private readonly _resource: PerfHeroResource) {}

  async acquire(Laya: any, heroType: number): Promise<PooledPerfHeroNode> {
    if (this._destroyed) throw new Error(`Perf hero pool has been destroyed: ${this._resource.skUrl}`);

    const idle = this._idle.pop();
    if (idle) {
      idle.heroType = heroType;
      return idle;
    }

    const templet = await this._loadTemplet(Laya);
    if (this._destroyed) throw new Error(`Perf hero pool has been destroyed: ${this._resource.skUrl}`);
    const skeleton = templet.buildArmature ? templet.buildArmature(0) : new Laya.Skeleton();
    if (!templet.buildArmature) skeleton.templet = templet;
    skeleton.name = `PerfHeroSkeleton:${this._resource.name}`;
    return new PooledPerfHeroNode(heroType, this._resource, skeleton);
  }

  release(instance: PooledPerfHeroNode): void {
    if (this._destroyed) {
      instance.destroy();
      return;
    }

    instance.release();
    this._idle.push(instance);
  }

  destroy(): void {
    this._destroyed = true;
    for (const instance of this._idle) {
      instance.destroy();
    }
    this._idle.length = 0;
  }

  private _loadTemplet(Laya: any): Promise<any> {
    let promise = PerfHeroSpinePool._templetPromises.get(this._resource.skUrl);
    if (!promise) {
      promise = Laya.loader.load(this._resource.skUrl);
      PerfHeroSpinePool._templetPromises.set(this._resource.skUrl, promise);
    }
    return promise;
  }
}

class PooledPerfHeroNode {
  constructor(
    public heroType: number,
    private readonly _resource: PerfHeroResource,
    private readonly _skeleton: any,
  ) {}

  get skUrl(): string {
    return this._resource.skUrl;
  }

  attachTo(parent: any): void {
    if (this._skeleton.parent !== parent) {
      parent.addChild(this._skeleton);
    }
    this._skeleton.visible = true;
  }

  play(Laya: any, caller: any, stoppedHandler: () => void): void {
    this._skeleton.offAll?.();
    this._skeleton.visible = true;
    this._skeleton.on?.(Laya.Event.STOPPED, caller, stoppedHandler);
    this._skeleton.play(0, false);
  }

  release(): void {
    this._skeleton.offAll?.();
    this._skeleton.stop?.();
    this._skeleton.visible = false;
    if (this._skeleton.removeSelf) {
      this._skeleton.removeSelf();
    } else {
      this._skeleton.parent?.removeChild?.(this._skeleton);
    }
  }

  destroy(): void {
    this._skeleton.offAll?.();
    this._skeleton.destroy();
  }
}
