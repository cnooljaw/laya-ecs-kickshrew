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
import { hitResponseSystem } from "../ecs/gameplay/hud/HitResponseSystem";
import { SyncView } from "../binding/SyncView";
import { NetworkAdapter } from "../network/NetworkAdapter";
import type { KickResponse } from "../network/ProtocolTypes";
import { DirtyComponent } from "../ecs/components";
import { GameLoopPipeline } from "./GameLoopPipeline";
import { KickInputAdapter } from "./KickInputAdapter";
import { ViewRegistry } from "./ViewRegistry";
import { getPerfShrewTiming, getPerfTestRuntimeConfig, PerfTestRuntimeConfig } from "../config/PerfTestConfig";
import { resetShrewTimingOverride, setShrewTimingOverride } from "../config/GameTuning";
import { GAME_FEATURE_REGISTRY } from "../features/GameFeatures";
import type { GameRuntimeRefs } from "../features/GameFeature";

/** 音效路径 */
const SND = {
  bg:      "resources/sound/sound_shrew/back.wav",
};

export class GameScene {
  private _world: any;
  private _singletons!: SingletonEntities;
  private _syncView: SyncView;
  private _network: NetworkAdapter;
  private _viewRegistry: ViewRegistry;
  private _perfConfig: PerfTestRuntimeConfig;
  private _running: boolean = false;
  private _root: any = null;
  private _runtimeRefs: GameRuntimeRefs = {};
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
    this._singletons = createSingletonEntities(this._world);
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

    const featureForceFullEntities: number[] = [];
    this._runtimeRefs = {};
    GAME_FEATURE_REGISTRY.setupAll({
      world: this._world,
      root: this._root,
      singletons: this._singletons,
      viewRegistry: this._viewRegistry,
      perfConfig: this._perfConfig,
      runtimeRefs: this._runtimeRefs,
      forceFullSyncEntities: featureForceFullEntities,
    });

    // 3. 注册视图绑定
    this._syncView.registerChannels(GAME_FEATURE_REGISTRY.viewSyncChannels());

    // 4. 设置网络回调
    this._network.onResponse((resp: KickResponse) => {
      hitResponseSystem(this._world, resp);
    });

    this._loopPipeline = new GameLoopPipeline({
      world: this._world,
      network: this._network,
      syncView: this._syncView,
      featureRegistry: GAME_FEATURE_REGISTRY,
    });

    this._kickInput = new KickInputAdapter({
      world: this._world,
      singletons: this._singletons,
      network: this._network,
      getHammerNode: () => this._runtimeRefs.hammerNode ?? null,
      playSound: (url: string) => {
        const RuntimeLaya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
        if (RuntimeLaya) RuntimeLaya.SoundManager.playSound(url);
      },
    });

    // 5. 首次全量同步（设置 forceFullSync，确保所有节点显示正确初始状态）
    for (const eid of new Set(featureForceFullEntities)) {
      DirtyComponent.forceFullSync[eid] = 1;
    }
    this._syncView.sync(this._world);
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
    this._runtimeRefs.perfHeroPool?.destroy();
    this._runtimeRefs = {};
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
