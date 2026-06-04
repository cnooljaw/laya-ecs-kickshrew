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
import { createGameWorld, createShrewEntity, createHoleEntities, createSingletonEntities, createPerfHeroEntities, SingletonEntities } from "../ecs/world";
import { hitResponseSystem } from "../ecs/systems/HitResponseSystem";
import { SyncView } from "../binding/SyncView";
import { shrewViewBinding, shrewAnimationViewBinding } from "../binding/ShrewViewBinding";
import { holeViewBinding } from "../binding/HoleViewBinding";
import { hammerViewBinding } from "../binding/HammerViewBinding";
import { comboViewBinding } from "../binding/ComboViewBinding";
import { sceneViewBinding } from "../binding/SceneViewBinding";
import { playerViewBinding } from "../binding/PlayerViewBinding";
import { hitViewBinding } from "../binding/HitViewBinding";
import { perfHeroViewBinding } from "../binding/PerfHeroViewBinding";
import { NetworkAdapter } from "../network/NetworkAdapter";
import type { KickResponse } from "../network/ProtocolTypes";
import { ShrewType, MapType, HOLE_COUNT, HammerType } from "../ecs/types";
import { HoleComponent, DirtyComponent } from "../ecs/components";
import { ShrewNode } from "./ShrewNode";
import { HoleNode } from "./HoleNode";
import { HammerNode } from "./HammerNode";
import { ComboNode } from "./ComboNode";
import { SceneLayer } from "./SceneLayer";
import { PlayerHUD } from "./PlayerHUD";
import { HitEffectNode } from "./HitEffectNode";
import { GameLoopPipeline } from "./GameLoopPipeline";
import { KickInputAdapter } from "./KickInputAdapter";
import { ViewRegistry } from "./ViewRegistry";
import { PerfHeroNode, PerfHeroSpinePoolGroup } from "./PerfHeroNode";
import { getPerfShrewTiming, getPerfTestRuntimeConfig, PerfTestRuntimeConfig } from "../config/PerfTestConfig";
import { resetShrewTimingOverride, setShrewTimingOverride } from "../config/GameTuning";

/** 音效路径 */
const SND = {
  bg:      "resources/sound/sound_shrew/back.wav",
};

export class GameScene {
  private _world: any;
  private _singletons!: SingletonEntities;
  private _holes: number[] = [];
  private _shrews: number[] = [];
  private _perfHeroes: number[] = [];
  private _syncView: SyncView;
  private _network: NetworkAdapter;
  private _viewRegistry: ViewRegistry;
  private _perfConfig: PerfTestRuntimeConfig;
  private _running: boolean = false;
  private _root: any = null;
  private _hammerNode!: HammerNode;
  private _hitEffectNode!: HitEffectNode;
  private _loopPipeline: GameLoopPipeline | null = null;
  private _kickInput: KickInputAdapter | null = null;
  private _perfHeroPool: PerfHeroSpinePoolGroup | null = null;

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

    // 3. 创建场景背景层
    const sceneLayer = new SceneLayer();
    sceneLayer.create(this._root);
    this._viewRegistry.registerSceneLayer(this._singletons.scene, sceneLayer);

    // 4. 创建洞位和地鼠（洞位在后，地鼠在前）
    this._holes = createHoleEntities(this._world, MapType.Meadow);
    for (let i = 0; i < HOLE_COUNT; i++) {
      const holeEid = this._holes[i];
      const shrewType = this._randomShrewType();
      const shrewEid = createShrewEntity(this._world, shrewType, MapType.Meadow);
      this._shrews.push(shrewEid);

      // 关联 hole 和 shrew
      HoleComponent.shrewEid[holeEid] = shrewEid;

      // 创建洞位视图节点
      const holeNode = new HoleNode();
      holeNode.create(this._root);
      holeNode.setPosition(HoleComponent.posXRatio[holeEid], HoleComponent.posYRatio[holeEid]);
      holeNode.setZOrder(HoleComponent.zIndex[holeEid]);
      this._viewRegistry.registerHoleNode(holeEid, holeNode);

      // 创建地鼠视图节点（作为洞位子节点）
      const shrewNode = new ShrewNode();
      shrewNode.create(holeNode.getContainer() || this._root);
      shrewNode.setSpriteFrame(shrewType, MapType.Meadow);
      this._viewRegistry.registerShrewNode(shrewEid, shrewNode);
    }

    // 5. 创建锤子光标
    this._hammerNode = new HammerNode();
    this._hammerNode.create(this._root);
    this._viewRegistry.registerHammerNode(this._singletons.hammer, this._hammerNode);

    // 6. 创建玩家 HUD
    const playerHUD = new PlayerHUD();
    playerHUD.create(this._root);
    this._viewRegistry.registerPlayerHUD(this._singletons.player, playerHUD);

    // 7. 创建连击特效节点
    const comboNode = new ComboNode();
    comboNode.create(this._root);
    this._viewRegistry.registerComboNode(this._singletons.combo, comboNode);

    // 8. 创建击中特效节点（金币/宝箱）
    this._hitEffectNode = new HitEffectNode();
    this._hitEffectNode.create(this._root);
    // HitEffectNode 使用单例 player 实体注册（简化）
    this._viewRegistry.registerHitEffectNode(this._singletons.player, this._hitEffectNode);

    if (this._perfConfig.heroCount > 0) {
      this._createPerfHeroes(this._perfConfig.heroCount);
    }

    // 9. 注册视图绑定
    this._syncView.registerShrewBinding(shrewViewBinding);
    this._syncView.registerAnimBinding(shrewAnimationViewBinding);
    this._syncView.registerHoleBinding(holeViewBinding);
    this._syncView.registerHammerBinding(hammerViewBinding);
    this._syncView.registerComboBinding(comboViewBinding);
    this._syncView.registerSceneBinding(sceneViewBinding);
    this._syncView.registerPlayerBinding(playerViewBinding);
    this._syncView.registerHitBinding(hitViewBinding);
    this._syncView.registerPerfHeroBinding(perfHeroViewBinding);

    // 10. 设置网络回调
    this._network.onResponse((resp: KickResponse) => {
      hitResponseSystem(this._world, resp);
    });

    this._loopPipeline = new GameLoopPipeline({
      world: this._world,
      network: this._network,
      syncView: this._syncView,
    });

    this._kickInput = new KickInputAdapter({
      world: this._world,
      singletons: this._singletons,
      network: this._network,
      getHammerNode: () => this._hammerNode ?? null,
      playSound: (url: string) => {
        const RuntimeLaya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;
        if (RuntimeLaya) RuntimeLaya.SoundManager.playSound(url);
      },
    });

    // 11. 首次全量同步（设置 forceFullSync，确保所有节点显示正确初始状态）
    const allEntities = [
      this._singletons.scene,
      this._singletons.player,
      this._singletons.hammer,
      this._singletons.combo,
      ...this._holes,
      ...this._shrews,
      ...this._perfHeroes,
    ];
    for (const eid of allEntities) {
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
    this._perfHeroPool?.destroy();
    this._perfHeroPool = null;
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

  /** 随机选择地鼠类型 */
  private _randomShrewType(): ShrewType {
    const types = [ShrewType.Red, ShrewType.Blue, ShrewType.Yellow, ShrewType.Green];
    return types[Math.floor(Math.random() * types.length)];
  }

  private _createPerfHeroes(count: number): void {
    this._perfHeroes = createPerfHeroEntities(this._world, count);
    this._perfHeroPool = new PerfHeroSpinePoolGroup();
    for (const eid of this._perfHeroes) {
      const node = new PerfHeroNode(this._perfHeroPool);
      node.create(this._root);
      this._viewRegistry.registerPerfHeroNode(eid, node);
    }
  }
}
