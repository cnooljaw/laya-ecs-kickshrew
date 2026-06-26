/**
 * GameScene — 游戏主场景
 *
 * 职责:
 * 1. 初始化 ECS 世界和实体
 * 2. 注册帧循环执行所有系统
 * 3. 创建和绑定视图节点
 * 4. 处理触摸事件
 * 5. 启动网络层
 */
import { createGameWorld } from "../ecs/world";
import { deleteWorld } from "bitecs";
import { NetworkAdapter } from "../network/NetworkAdapter";
import type { KickResponse } from "../network/ProtocolTypes";
import { GameLoopPipeline } from "./GameLoopPipeline";
import { ViewRegistry } from "../framework/view/ViewRegistry";
import { getPerfShrewTiming, getPerfTestRuntimeConfig, PerfTestRuntimeConfig } from "../game/features/perfHero";
import {
  resetShrewTimingOverride,
  setShrewTimingOverride,
} from "../game/features/shrew";
import { GAME_FEATURE_REGISTRY } from "../game/GameFeatures";
import { createFeatureRuntimeContext } from "../framework/feature/FeatureRuntimeContext";
import { createEntityRuntime, type EntityRuntime } from "../framework/ecs/EntityRuntime";
import {
  createProjectionRuntime,
  type ProjectionRuntime,
} from "../framework/sync/ProjectionRuntime";
import { createEffectRuntime, type EffectRuntime } from "../framework/sync/EffectRuntime";
import {
  KickInputController,
  createKickInputController,
  routeKickResponse,
} from "../game/session";

/** 音效路径 */
const SND = {
  bg:      "resources/sound/sound_shrew/back.wav",
};

export class GameScene {
  private _world: any = null;
  private _network: NetworkAdapter;
  private _viewRegistry: ViewRegistry;
  private _perfConfig: PerfTestRuntimeConfig;
  private _running: boolean = false;
  private _root: any = null;
  private _entityRuntime: EntityRuntime | null = null;
  private _projectionRuntime: ProjectionRuntime | null = null;
  private _effectRuntime: EffectRuntime | null = null;
  private _loopPipeline: GameLoopPipeline | null = null;
  private _kickInput: KickInputController | null = null;

  constructor() {
    this._network = new NetworkAdapter();
    this._viewRegistry = new ViewRegistry();
    this._perfConfig = getPerfTestRuntimeConfig();
  }

  /** 初始化游戏 */
  init(): void {
    // 1. 创建 ECS 世界
    this._world = createGameWorld();
    this._entityRuntime = createEntityRuntime(
      this._world,
      GAME_FEATURE_REGISTRY.entityTypes(),
    );
    this._entityRuntime.bootstrapSingletons();
    this._projectionRuntime = createProjectionRuntime(
      GAME_FEATURE_REGISTRY.projections(),
    );
    this._effectRuntime = createEffectRuntime();
    if (this._perfConfig.shrewFast) {
      setShrewTimingOverride(getPerfShrewTiming());
    } else {
      resetShrewTimingOverride();
    }

    // 2. 创建 Laya 根容器，并播放背景音乐
    const Laya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
    if (Laya) {
      this._root = new Laya.Sprite();
      this._root.name = "GameSceneRoot";
      Laya.stage.addChild(this._root);
      // 背景音乐（循环播放）
      Laya.SoundManager.playMusic(SND.bg, 0);
    }

    GAME_FEATURE_REGISTRY.setupAll(createFeatureRuntimeContext({
      root: this._root,
      viewRegistry: this._viewRegistry,
      entityRuntime: this._entityRuntime,
      projectionRuntime: this._projectionRuntime,
      effectRuntime: this._effectRuntime,
    }));

    // 3. 设置网络回调
    this._network.onResponse((resp: KickResponse) => {
      routeKickResponse(this._world, this._effectRuntime!, resp);
    });

    this._loopPipeline = new GameLoopPipeline({
      world: this._world,
      network: this._network,
      featureRegistry: GAME_FEATURE_REGISTRY,
      projectionRuntime: this._projectionRuntime,
      effects: this._effectRuntime,
    });

    this._kickInput = createKickInputController({
      world: this._world,
      network: this._network,
      effects: this._effectRuntime,
      playSound: (url: string) => {
        const RuntimeLaya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
        if (RuntimeLaya) RuntimeLaya.SoundManager.playSound(url);
      },
    });

    // 4. 统一执行首次投影同步。
    this._projectionRuntime.mark(this._world);
    this._projectionRuntime.sync(this._world);
  }

  /** 启动帧循环 */
  start(): void {
    this._running = true;
  }

  /** 停止帧循环 */
  stop(): void {
    this._running = false;
  }

  /** 销毁场景运行时资源 */
  destroy(): void {
    this.stop();
    this._network.destroy();
    resetShrewTimingOverride();
    this._kickInput = null;
    this._loopPipeline = null;
    this._viewRegistry.clear();
    this._effectRuntime?.clear();
    this._effectRuntime = null;
    this._projectionRuntime?.clear();
    this._projectionRuntime = null;
    this._entityRuntime?.clear();
    this._entityRuntime = null;
    if (this._world) {
      deleteWorld(this._world);
      this._world = null;
    }
    if (this._root) {
      this._root.destroy();
      this._root = null;
    }
  }

  /** 每帧更新 (由 Laya.timer.frameLoop 调用) */
  update(deltaSec: number): void {
    if (!this._running) return;
    this._loopPipeline?.update(deltaSec);
  }

  /** 触摸事件处理 (由 Laya 触摸事件调用)
   *  @param x 设计坐标系中的绝对 X（stage.mouseX）
   *  @param y 设计坐标系中的绝对 Y（stage.mouseY）
   */
  onTouch(x: number, y: number): void {
    this._kickInput?.handleTouch(x, y);
  }
}
