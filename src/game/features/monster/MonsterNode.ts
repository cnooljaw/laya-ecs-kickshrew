import { destroyNode } from "../../../framework/view/LayaLifecycle";
import { loadSpineTemplate } from "../../../framework/view/LayaLoader";
import { getLaya } from "../../../framework/view/LayaRuntime";
import { createSkeleton } from "../../../framework/view/LayaSpine";
import { DESIGN_RESOLUTION } from "../../../config/GameTuning";
import { MonsterType } from "./MonsterTypes";
import { MonsterAction } from "./MonsterTypes";
import { MONSTER_VIEW_CONFIG, type MonsterViewConfig, type MonsterVisualBounds } from "./MonsterViewConfig";
import type { IMonsterNode } from "./IMonsterNode";

interface MonsterPlayRequest {
  monsterType: number;
  skUrl: string;
  spawnSeq: number;
}

interface MonsterNodeOptions {
  resolveSkUrl?: (monsterType: number) => string;
  resolveViewConfig?: (monsterType: number) => MonsterViewConfig;
}

const MONSTER_SKELETON_ANI_MODE = 2;
const MONSTER_WHOLE_BODY_SLOT = "zong";

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
  visualBounds: MonsterDebugBounds;
  rawSkeletonBounds: MonsterDebugBounds | null;
}

export class MonsterNode implements IMonsterNode {
  private readonly _resolveSkUrl: (monsterType: number) => string;
  private readonly _resolveViewConfig: (monsterType: number) => MonsterViewConfig;
  private _container: any = null;
  private _skeleton: any = null;
  private _destroyed = false;
  private _visible = false;
  private _lastSpawnSeq = -1;
  private _loadedMonsterType = 0;
  private _loopPlaying = false;
  private _monsterType = MonsterType.Rhino;
  private _baseX = 0;
  private _baseY = 0;
  private _offsetY = 0;
  private _actionState = MonsterAction.Wait;
  private _animationProgress = 0;

  constructor(options: MonsterNodeOptions = {}) {
    this._resolveSkUrl = options.resolveSkUrl ?? resolveDefaultMonsterSkUrl;
    this._resolveViewConfig = options.resolveViewConfig ?? resolveDefaultMonsterViewConfig;
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
    this._monsterType = monsterType as MonsterType;
    this._lastSpawnSeq = spawnSeq;
    this._loadAndPlay({ monsterType, skUrl: this._resolveSkUrl(monsterType), spawnSeq });
  }

  playHit(_hitSeq: number): void {}

  playDefeated(_defeatedSeq: number): void {
    if (_defeatedSeq <= 0) return;
    this._skeleton?.play?.(0, false);
    this._hideWholeBodySlot();
    this._loopPlaying = false;
  }

  setAnimation(actionState: number, progress: number): void {
    this._actionState = actionState;
    this._animationProgress = progress;
    if (actionState === MonsterAction.Wait) {
      this._stopLoop();
      this.setVisible(false);
    }
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
    const visualBounds = this._toWorldBounds(containerAnchor, this._getVisualBounds());
    const rawSkeletonBounds = this._getSkeletonBounds();

    return {
      containerAnchor,
      visualBounds,
      rawSkeletonBounds: rawSkeletonBounds ? this._toWorldBounds(containerAnchor, rawSkeletonBounds) : null,
    };
  }

  private _toWorldBounds(
    containerAnchor: { x: number; y: number },
    bounds: { x: number; y: number; width: number; height: number },
  ): MonsterDebugBounds {
    const x = containerAnchor.x + bounds.x;
    const y = containerAnchor.y + bounds.y;
    const width = bounds.width;
    const height = bounds.height;

    return {
      x,
      y,
      width,
      height,
      centerX: x + width * 0.5,
      centerY: y + height * 0.5,
    };
  }

  private _applyTransform(): void {
    if (!this._container) return;
    const offset = this._getSkeletonCenterOffset();
    this._container.x = this._baseX - offset.x;
    this._container.y = this._baseY - offset.y + this._offsetY;
  }

  private _getSkeletonCenterOffset(): { x: number; y: number } {
    const bounds = this._getVisualBounds();
    if (!this._container) return { x: 0, y: 0 };
    return {
      x: bounds.x + bounds.width * 0.5,
      y: bounds.y + bounds.height * 0.5,
    };
  }

  private _getVisualBounds(): MonsterVisualBounds {
    return this._resolveViewConfig(this._monsterType).visualBounds;
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
    this._loadedMonsterType = 0;
    this._loopPlaying = false;
    destroyNode(this._container);
    this._container = null;
  }

  private async _loadAndPlay(request: MonsterPlayRequest): Promise<void> {
    const Laya = getLaya();
    if (!Laya || !this._container) return;

    if (this._skeleton && this._loadedMonsterType === request.monsterType) {
      this._skeleton.visible = this._visible;
      this._playLoopIfNeeded();
      return;
    }

    try {
      const templet = await loadSpineTemplate(request.skUrl);
      if (this._destroyed || !this._container || request.spawnSeq !== this._lastSpawnSeq) return;

      destroyNode(this._skeleton);
      this._skeleton = createSkeleton(templet, MONSTER_SKELETON_ANI_MODE);
      this._loadedMonsterType = request.monsterType;
      this._loopPlaying = false;
      this._skeleton.name = `MonsterSkeleton:${request.monsterType}`;
      this._skeleton.visible = this._visible;
      this._container.addChild(this._skeleton);
      this._playLoopIfNeeded();
    } catch {
      this.setVisible(false);
    }
  }

  private _playLoopIfNeeded(): void {
    if (!this._skeleton || this._loopPlaying) return;
    this._skeleton.play?.(0, true);
    this._hideWholeBodySlot();
    this._loopPlaying = true;
  }

  private _hideWholeBodySlot(): void {
    this._skeleton?.showSlotSkinByIndex?.(MONSTER_WHOLE_BODY_SLOT, -1);
  }

  private _stopLoop(): void {
    if (!this._skeleton || !this._loopPlaying) return;
    this._skeleton.stop?.();
    this._loopPlaying = false;
  }
}

function resolveDefaultMonsterSkUrl(monsterType: number): string {
  return resolveDefaultMonsterViewConfig(monsterType).skUrl;
}

function resolveDefaultMonsterViewConfig(monsterType: number): MonsterViewConfig {
  return MONSTER_VIEW_CONFIG[monsterType as MonsterType]
    ?? MONSTER_VIEW_CONFIG[MonsterType.Rhino];
}
