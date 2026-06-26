import { destroyNode } from "../../../framework/view/LayaLifecycle";
import { loadSpineTemplate } from "../../../framework/view/LayaLoader";
import { getLaya } from "../../../framework/view/LayaRuntime";
import { createSkeleton } from "../../../framework/view/LayaSpine";
import { PERF_HERO_RESOURCES, PERF_HERO_VIEW_CONFIG } from "./PerfHeroViewConfig";
import type { IPerfHeroNode } from "./PerfHeroViewContract";

interface PerfHeroResource {
  name: string;
  skUrl: string;
}

interface PerfHeroNodeOptions {
  poolGroup?: PerfHeroSpinePoolGroup;
  resources?: readonly PerfHeroResource[];
}

interface PerfHeroPlayRequest {
  heroType: number;
  skUrl: string;
  x: number;
  y: number;
  scale: number;
  spawnSeq: number;
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
  private readonly _resources: readonly PerfHeroResource[];
  private _container: any = null;
  private _activeHeroNode: PooledPerfHeroNode | null = null;
  private _pendingPlay: PerfHeroPlayRequest | null = null;
  private _destroyed = false;
  private _isPlaying = false;
  private _lastSpawnSeq = -1;
  private _nextX = 0;
  private _nextY = 0;
  private _nextScale = 1;

  constructor(poolGroup?: PerfHeroSpinePoolGroup);
  constructor(options?: PerfHeroNodeOptions);
  constructor(poolGroupOrOptions: PerfHeroSpinePoolGroup | PerfHeroNodeOptions = {}) {
    const options = poolGroupOrOptions instanceof PerfHeroSpinePoolGroup
      ? { poolGroup: poolGroupOrOptions }
      : poolGroupOrOptions;
    this._resources = options.resources ?? PERF_HERO_RESOURCES;
    this._poolGroup = options.poolGroup ?? new PerfHeroSpinePoolGroup(this._resources);
    this._ownsPoolGroup = !options.poolGroup;
  }

  create(parent: any): void {
    const Laya = getLaya();
    if (!Laya) {
      this._container = parent;
      return;
    }

    this._container = new Laya.Sprite();
    this._container.name = "PerfHeroNode";
    this._container.zOrder = PERF_HERO_VIEW_CONFIG.zOrder;
    this._container.visible = false;
    if (parent) parent.addChild(this._container);
  }

  setTransform(x: number, y: number, scale: number): void {
    this._nextX = x;
    this._nextY = y;
    this._nextScale = scale;
  }

  playHero(heroType: number, spawnSeq: number): void {
    if (!this._container || spawnSeq === this._lastSpawnSeq || spawnSeq === this._pendingPlay?.spawnSeq) return;
    const resource = this._resources[heroType] ?? this._resources[0];
    if (!resource) return;
    const request = {
      heroType,
      skUrl: resource.skUrl,
      x: this._nextX,
      y: this._nextY,
      scale: this._nextScale,
      spawnSeq,
    };
    if (this._isPlaying && this._container.visible) {
      this._pendingPlay = request;
      return;
    }

    this._applyPlay(request);
  }

  destroy(): void {
    this._destroyed = true;
    this._pendingPlay = null;
    this._releaseActiveHeroNode();
    if (this._container) {
      destroyNode(this._container);
      this._container = null;
    }
    if (this._ownsPoolGroup) {
      this._poolGroup.destroy();
    }
  }

  private _applyPlay(request: PerfHeroPlayRequest): void {
    if (!this._container) return;
    this._lastSpawnSeq = request.spawnSeq;
    this._container.x = request.x;
    this._container.y = request.y;
    this._container.scaleX = request.scale;
    this._container.scaleY = request.scale;
    this._container.visible = false;

    const Laya = getLaya();
    if (!Laya) return;

    if (this._activeHeroNode?.skUrl === request.skUrl) {
      this._activeHeroNode.play(Laya, this, this._handleStopped);
      this._isPlaying = true;
      this._container.visible = true;
      return;
    }

    this._releaseActiveHeroNode();
    this._poolGroup.acquire(Laya, request.heroType, request.skUrl)
      .then((heroNode) => {
        if (this._destroyed || !this._container || request.spawnSeq !== this._lastSpawnSeq) {
          this._poolGroup.release(heroNode);
          return;
        }

        this._activeHeroNode = heroNode;
        heroNode.attachTo(this._container);
        heroNode.play(Laya, this, this._handleStopped);
        this._isPlaying = true;
        this._container.visible = true;
      })
      .catch(() => {
        if (this._container && request.spawnSeq === this._lastSpawnSeq) {
          this._container.visible = false;
        }
      });
  }

  private _handleStopped(): void {
    this._isPlaying = false;
    if (this._container) this._container.visible = false;
    const pending = this._pendingPlay;
    if (!pending) return;
    this._pendingPlay = null;
    this._applyPlay(pending);
  }

  private _releaseActiveHeroNode(): void {
    if (!this._activeHeroNode) return;
    this._poolGroup.release(this._activeHeroNode);
    this._activeHeroNode = null;
  }
}

class PerfHeroSpinePool {
  private readonly _idle: PooledPerfHeroNode[] = [];
  private _destroyed = false;

  constructor(private readonly _resource: PerfHeroResource) {}

  async acquire(_Laya: any, heroType: number): Promise<PooledPerfHeroNode> {
    if (this._destroyed) throw new Error(`Perf hero pool has been destroyed: ${this._resource.skUrl}`);

    const idle = this._idle.pop();
    if (idle) {
      idle.heroType = heroType;
      return idle;
    }

    const templet = await loadSpineTemplate(this._resource.skUrl);
    if (this._destroyed) throw new Error(`Perf hero pool has been destroyed: ${this._resource.skUrl}`);
    const skeleton = createSkeleton(templet);
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
    this._resetLocalTransform();
    this._skeleton.visible = false;
  }

  play(Laya: any, caller: any, stoppedHandler: () => void): void {
    this._skeleton.offAll?.();
    this._skeleton.visible = false;
    this._skeleton.on?.(Laya.Event.STOPPED, caller, stoppedHandler);
    this._skeleton.play(0, false);
    this._skeleton.visible = true;
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
    destroyNode(this._skeleton);
  }

  private _resetLocalTransform(): void {
    this._skeleton.x = 0;
    this._skeleton.y = 0;
    this._skeleton.scaleX = 1;
    this._skeleton.scaleY = 1;
    this._skeleton.rotation = 0;
    this._skeleton.alpha = 1;
  }
}
