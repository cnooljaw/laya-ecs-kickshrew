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
import { createGameWorld } from "../framework/ecs/GameWorld";
import { deleteWorld } from "bitecs";
import { NetworkAdapter } from "../network/NetworkAdapter";
import { resetServerClock } from "../network/ServerClock";
import { GameLoopPipeline } from "./GameLoopPipeline";
import { ViewRegistry } from "../framework/view/ViewRegistry";
import { getPerfShrewTiming, getPerfRuntimeConfig, PerfRuntimeConfig } from "../game/features/perfHero";
import { resetShrewTimingOverride, setShrewTimingOverride } from "../game/features/shrew";
import { GAME_FEATURE_REGISTRY } from "../game/GameFeatures";
import { createFeatureSetupContext } from "../framework/feature/FeatureSetupContext";
import { createEntityRuntime, type EntityRuntime } from "../framework/ecs/EntityRuntime";
import {
  createProjectionRuntime,
  type ProjectionRuntime,
} from "../framework/sync/ProjectionRuntime";
import { createEffectRuntime, type EffectRuntime } from "../framework/sync/EffectRuntime";
import type { GameFeatureRuntime } from "../framework/feature/FeatureRegistry";
import {
  KickInputController,
  createGameIngressQueue,
  createGameIngressSystem,
  createKickInputController,
  type GameIngressQueue,
} from "../game/session";
import { defineSystem } from "../framework/feature/FeatureManifest";
import type { GameSystemScheduleEntry } from "../framework/feature/FeatureRegistry";
import { createFrameDiagnostics, type FrameDiagnosticsSnapshot } from "./FrameDiagnostics";

/** 音效路径 */
const SND = {
  bg:      "resources/sound/sound_shrew/back.wav",
};

export interface GameRuntimeDebugInfo {
  readonly schedule: readonly GameSystemScheduleEntry[];
  readonly frame: FrameDiagnosticsSnapshot;
}

export class GameScene {
  private _world: any = null;
  private _network: NetworkAdapter;
  private _viewRegistry: ViewRegistry;
  private _perfConfig: PerfRuntimeConfig;
  private _running: boolean = false;
  private _root: any = null;
  private _entityRuntime: EntityRuntime | null = null;
  private _projectionRuntime: ProjectionRuntime | null = null;
  private _effectRuntime: EffectRuntime | null = null;
  private _loopPipeline: GameLoopPipeline | null = null;
  private _kickInput: KickInputController | null = null;
  private _featureRuntime: GameFeatureRuntime | null = null;
  private _ingressQueue: GameIngressQueue | null = null;
  private _frameDiagnostics: ReturnType<typeof createFrameDiagnostics> | null = null;

  constructor() {
    this._network = new NetworkAdapter();
    this._viewRegistry = new ViewRegistry();
    this._perfConfig = getPerfRuntimeConfig();
  }

  /** 初始化游戏 */
  init(): void {
    try {
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
      this._ingressQueue = createGameIngressQueue();
      this._frameDiagnostics = createFrameDiagnostics();
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

      this._featureRuntime = GAME_FEATURE_REGISTRY.setupAll(
        createFeatureSetupContext({
          root: this._root,
          viewRegistry: this._viewRegistry,
          entityRuntime: this._entityRuntime,
          projectionRuntime: this._projectionRuntime,
          effectRuntime: this._effectRuntime,
        }),
        [defineSystem(
          "ingress",
          "session.networkIngress",
          createGameIngressSystem(this._ingressQueue, this._effectRuntime),
        )],
      );

      // 3. 设置网络回调
      this._network.onResponse(resp => this._ingressQueue?.enqueueKickResponse(resp));
      this._network.onGameSnapshot((snapshot) => {
        this._ingressQueue?.enqueueSnapshot(snapshot);
      });
      this._network.onShrewTimeline((push) => {
        this._ingressQueue?.enqueueShrewTimeline(push);
      });
      this._network.onShrewState((push) => {
        this._ingressQueue?.enqueueShrewState(push);
      });
      this._network.onMapState((push) => {
        this._ingressQueue?.enqueueMapState(push);
      });
      this._network.onTimeSync((response) => {
        this._ingressQueue?.enqueueTimeSync(response);
      });

      this._loopPipeline = new GameLoopPipeline({
        world: this._world,
        network: this._network,
        featureRuntime: this._featureRuntime,
        projectionRuntime: this._projectionRuntime,
        effects: this._effectRuntime,
        diagnostics: this._frameDiagnostics,
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
      void this._network.requestGameSnapshot().catch((): void => undefined);
    } catch (error) {
      this.destroy();
      throw error;
    }
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
    resetServerClock();
    resetShrewTimingOverride();
    this._kickInput = null;
    this._loopPipeline = null;
    this._featureRuntime = null;
    this._frameDiagnostics = null;
    this._ingressQueue?.clear();
    this._ingressQueue = null;
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

  getRuntimeDebugInfo(): GameRuntimeDebugInfo | null {
    if (!this._featureRuntime || !this._frameDiagnostics) return null;
    return {
      schedule: this._featureRuntime.schedule(),
      frame: this._frameDiagnostics.snapshot(),
    };
  }
}
