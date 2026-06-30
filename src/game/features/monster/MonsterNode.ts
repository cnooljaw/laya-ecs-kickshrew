import { destroyNode } from "../../../framework/view/LayaLifecycle";
import { loadSpineTemplate } from "../../../framework/view/LayaLoader";
import { getLaya } from "../../../framework/view/LayaRuntime";
import { createSkeleton } from "../../../framework/view/LayaSpine";
import { DESIGN_RESOLUTION } from "../../../config/GameTuning";
import { MonsterType } from "./MonsterTypes";
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

export class MonsterNode implements IMonsterNode {
  private readonly _resolveSkUrl: (monsterType: number) => string;
  private _container: any = null;
  private _skeleton: any = null;
  private _destroyed = false;
  private _visible = false;
  private _lastSpawnSeq = -1;

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

  playHit(_hitSeq: number): void {
    if (_hitSeq <= 0) return;
    this._skeleton?.play?.(0, true);
  }

  playDefeated(_defeatedSeq: number): void {
    if (_defeatedSeq <= 0) return;
    this._skeleton?.play?.(0, false);
  }

  setPosition(x: number, y: number): void {
    if (!this._container) return;
    this._container.x = x * DESIGN_RESOLUTION.width;
    this._container.y = y * DESIGN_RESOLUTION.height;
  }

  setScale(scale: number): void {
    if (!this._container) return;
    this._container.scaleX = scale;
    this._container.scaleY = scale;
  }

  setZOrder(z: number): void {
    if (this._container) this._container.zOrder = z;
  }

  setVisible(visible: boolean): void {
    this._visible = visible;
    if (this._container) this._container.visible = visible;
    if (this._skeleton) this._skeleton.visible = visible;
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
