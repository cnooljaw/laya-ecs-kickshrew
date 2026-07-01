import { destroyNode } from "../../../framework/view/LayaLifecycle";
import { loadSpineTemplate } from "../../../framework/view/LayaLoader";
import { getLaya } from "../../../framework/view/LayaRuntime";
import { createSkeleton } from "../../../framework/view/LayaSpine";
import { DESIGN_RESOLUTION } from "../../../config/GameTuning";
import { MonsterType } from "./MonsterTypes";
import { MonsterAction } from "./MonsterTypes";
import { MONSTER_VIEW_CONFIG } from "./MonsterViewConfig";
import type { IMonsterNode } from "./IMonsterNode";

interface MonsterPlayRequest {
  monsterType: number;
  skUrl: string;
  spawnSeq: number;
}

interface MonsterNodeOptions {
  resolveSkUrl?: (monsterType: number) => string;
}

interface MonsterDebugBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface MonsterDebugGeometry {
  containerAnchor: { x: number; y: number };
  skeletonBounds: MonsterDebugBounds | null;
}

export class MonsterNode implements IMonsterNode {
  private readonly _resolveSkUrl: (monsterType: number) => string;
  private _container: any = null;
  private _skeleton: any = null;
  private _destroyed = false;
  private _visible = false;
  private _lastSpawnSeq = -1;
  private _baseX = 0;
  private _baseY = 0;
  private _offsetY = 0;
  private _scale = 1;
  private _actionState = MonsterAction.Wait;
  private _animationProgress = 0;

  constructor(options: MonsterNodeOptions = {}) {
    this._resolveSkUrl = options.resolveSkUrl ?? resolveDefaultMonsterSkUrl;
  }

  create(parent: any): void {
    const Laya = getLaya();
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

  spawn(monsterType: number, spawnSeq: number): void {
    if (!this._container || spawnSeq <= 0 || spawnSeq === this._lastSpawnSeq) return;
    this._lastSpawnSeq = spawnSeq;
    this._loadAndPlay({ monsterType, skUrl: this._resolveSkUrl(monsterType), spawnSeq });
  }

  playHit(_hitSeq: number): void {}

  playDefeated(_defeatedSeq: number): void {
    if (_defeatedSeq <= 0) return;
    this._skeleton?.play?.(0, false);
  }

  setAnimation(actionState: number, progress: number): void {
    this._actionState = actionState;
    this._animationProgress = progress;
    if (actionState === MonsterAction.Drop) {
      const clamped = Math.max(0, Math.min(1, progress));
      this._offsetY = -this._baseY * (1 - clamped);
    } else {
      this._offsetY = 0;
    }
    this._applyTransform();
  }

  setPosition(x: number, y: number): void {
    this._baseX = x * DESIGN_RESOLUTION.width;
    this._baseY = y * DESIGN_RESOLUTION.height;
    this._applyTransform();
  }

  setScale(scale: number): void {
    this._scale = scale;
    if (!this._container) return;
    this._container.scaleX = scale;
    this._container.scaleY = scale;
    this.setAnimation(this._actionState, this._animationProgress);
  }

  setZOrder(z: number): void {
    if (this._container) this._container.zOrder = z;
  }

  setVisible(visible: boolean): void {
    this._visible = visible;
    if (this._container) this._container.visible = visible;
    if (this._skeleton) this._skeleton.visible = visible;
  }

  getDebugGeometry(): MonsterDebugGeometry | null {
    if (!this._container) return null;

    const containerAnchor = {
      x: this._container.x ?? 0,
      y: this._container.y ?? 0,
    };
    const bounds = this._getSkeletonBounds();
    if (!bounds) {
      return { containerAnchor, skeletonBounds: null };
    }

    const scaleX = this._container.scaleX ?? this._scale;
    const scaleY = this._container.scaleY ?? this._scale;
    const x = containerAnchor.x + bounds.x * scaleX;
    const y = containerAnchor.y + bounds.y * scaleY;
    const width = bounds.width * scaleX;
    const height = bounds.height * scaleY;

    return {
      containerAnchor,
      skeletonBounds: {
        x,
        y,
        width,
        height,
        centerX: x + width * 0.5,
        centerY: y + height * 0.5,
      },
    };
  }

  private _applyTransform(): void {
    if (!this._container) return;
    const offset = this._getSkeletonCenterOffset();
    this._container.x = this._baseX - offset.x;
    this._container.y = this._baseY - offset.y + this._offsetY;
  }

  private _getSkeletonCenterOffset(): { x: number; y: number } {
    const bounds = this._getSkeletonBounds();
    if (!bounds || !this._container) return { x: 0, y: 0 };
    const scaleX = this._container.scaleX ?? this._scale;
    const scaleY = this._container.scaleY ?? this._scale;
    return {
      x: (bounds.x + bounds.width * 0.5) * scaleX,
      y: (bounds.y + bounds.height * 0.5) * scaleY,
    };
  }

  private _getSkeletonBounds(): { x: number; y: number; width: number; height: number } | null {
    if (!this._skeleton) return null;
    const bounds = this._skeleton.getBounds?.();
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
      return null;
    }
    return bounds;
  }

  destroy(): void {
    this._destroyed = true;
    destroyNode(this._skeleton);
    this._skeleton = null;
    destroyNode(this._container);
    this._container = null;
  }

  private async _loadAndPlay(request: MonsterPlayRequest): Promise<void> {
    const Laya = getLaya();
    if (!Laya || !this._container) return;

    try {
      const templet = await loadSpineTemplate(request.skUrl);
      if (this._destroyed || !this._container || request.spawnSeq !== this._lastSpawnSeq) return;

      destroyNode(this._skeleton);
      this._skeleton = createSkeleton(templet);
      this._skeleton.name = `MonsterSkeleton:${request.monsterType}`;
      this._skeleton.visible = this._visible;
      this._container.addChild(this._skeleton);
      this._skeleton.play?.(0, true);
      this.setAnimation(this._actionState, this._animationProgress);
    } catch {
      this.setVisible(false);
    }
  }
}

function resolveDefaultMonsterSkUrl(monsterType: number): string {
  const config = MONSTER_VIEW_CONFIG[monsterType as MonsterType]
    ?? MONSTER_VIEW_CONFIG[MonsterType.Rhino];
  return config.skUrl;
}
