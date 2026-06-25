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
import { createGameWorld, createSingletonEntities, SingletonEntities } from "../ecs/world";
import { deleteWorld } from "bitecs";
import { hitResponseSystem } from "../ecs/gameplay/hud/HitResponseSystem";
import { SyncView } from "../binding/SyncView";
import { createViewSyncRuntime, type ViewSyncRuntime } from "../binding/ViewSyncRuntime";
import { NetworkAdapter } from "../network/NetworkAdapter";
import type { KickResponse } from "../network/ProtocolTypes";
import { GameLoopPipeline } from "./GameLoopPipeline";
import { KickInputAdapter } from "./KickInputAdapter";
import { ViewRegistry } from "./ViewRegistry";
import { getPerfShrewTiming, getPerfTestRuntimeConfig, PerfTestRuntimeConfig } from "../config/PerfTestConfig";
import { resetShrewTimingOverride, setShrewTimingOverride } from "../config/GameTuning";
import { GAME_FEATURE_REGISTRY } from "../features/GameFeatures";
import { releaseDirtyWorld } from "../sync/dirty/DirtyMarkSystem";
import { createFeatureSetupContext } from "../features/GameFeatureRuntime";
import { createEntityRuntime, type EntityRuntime } from "../ecs/runtime/EntityRuntime";
import {
  createProjectionRuntime,
  type ProjectionRuntime,
} from "../sync/projection/ProjectionRuntime";
import { HammerEntity } from "../ecs/gameplay/hammer/HammerEntity";
import { SceneEntity } from "../ecs/gameplay/core/CoreEntities";

/** 音效路径 */
const SND = {
  bg:      "resources/sound/sound_shrew/back.wav",
};

export class GameScene {
  private _world: any = null;
  private _singletons!: SingletonEntities;
  private _syncView: SyncView;
  private _network: NetworkAdapter;
  private _viewRegistry: ViewRegistry;
  private _perfConfig: PerfTestRuntimeConfig;
  private _running: boolean = false;
  private _root: any = null;
  private _viewSyncRuntime: ViewSyncRuntime | null = null;
  private _entityRuntime: EntityRuntime | null = null;
  private _projectionRuntime: ProjectionRuntime | null = null;
  private _loopPipeline: GameLoopPipeline | null = null;
  private _kickInput: KickInputAdapter | null = null;

  constructor() {
    this._syncView = new SyncView();
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
    const hammerEid = this._entityRuntime.one(HammerEntity);
    this._singletons = createSingletonEntities(this._world, {
      hammer: hammerEid,
      scene: this._entityRuntime.one(SceneEntity),
    });
    this._projectionRuntime = createProjectionRuntime(
      GAME_FEATURE_REGISTRY.projections(),
    );
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

    this._viewSyncRuntime = createViewSyncRuntime(GAME_FEATURE_REGISTRY.viewSyncs());
    this._syncView.registerChannels(this._viewSyncRuntime.channels());

    GAME_FEATURE_REGISTRY.setupAll(createFeatureSetupContext({
      world: this._world,
      root: this._root,
      singletons: this._singletons,
      perfConfig: this._perfConfig,
      viewRegistry: this._viewRegistry,
      viewSyncRuntime: this._viewSyncRuntime,
      entityRuntime: this._entityRuntime,
      projectionRuntime: this._projectionRuntime,
    }));

    // 3. 设置网络回调
    this._network.onResponse((resp: KickResponse) => {
      hitResponseSystem(this._world, resp);
    });

    this._loopPipeline = new GameLoopPipeline({
      world: this._world,
      network: this._network,
      syncView: this._syncView,
      featureRegistry: GAME_FEATURE_REGISTRY,
      projectionRuntime: this._projectionRuntime,
    });

    this._kickInput = new KickInputAdapter({
      world: this._world,
      hammerEid,
      network: this._network,
      playSound: (url: string) => {
        const RuntimeLaya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
        if (RuntimeLaya) RuntimeLaya.SoundManager.playSound(url);
      },
    });

    // 4. mount 已设置 forceFullSync，统一执行首次同步。
    this._syncView.sync(this._world);
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
    this._projectionRuntime?.clear();
    this._projectionRuntime = null;
    this._viewSyncRuntime?.clear();
    this._viewSyncRuntime = null;
    this._entityRuntime?.clear();
    this._entityRuntime = null;
    this._syncView.clear();
    if (this._world) {
      releaseDirtyWorld(this._world);
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
