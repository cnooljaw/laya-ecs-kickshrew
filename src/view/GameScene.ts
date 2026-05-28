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
import { createGameWorld, createShrewEntity, createHoleEntities, createSingletonEntities, SingletonEntities } from "../ecs/world";
import { animationTimerSystem } from "../ecs/systems/AnimationTimerSystem";
import { shrewStateSystem } from "../ecs/systems/ShrewStateSystem";
import { comboSystem } from "../ecs/systems/ComboSystem";
import { sceneCycleSystem } from "../ecs/systems/SceneCycleSystem";
import { hammerSystem } from "../ecs/systems/HammerSystem";
import { hitDetectionSystem } from "../ecs/systems/HitDetectionSystem";
import { hitResponseSystem } from "../ecs/systems/HitResponseSystem";
import { dirtyMarkSystem } from "../ecs/systems/DirtyMarkSystem";
import { SyncView } from "../binding/SyncView";
import { shrewViewBinding, shrewAnimationViewBinding, registerShrewNode } from "../binding/ShrewViewBinding";
import { holeViewBinding, registerHoleNode } from "../binding/HoleViewBinding";
import { hammerViewBinding, registerHammerNode } from "../binding/HammerViewBinding";
import { comboViewBinding, registerComboNode } from "../binding/ComboViewBinding";
import { sceneViewBinding, registerSceneLayer } from "../binding/SceneViewBinding";
import { playerViewBinding, registerPlayerHUD } from "../binding/PlayerViewBinding";
import { hitViewBinding, registerHitEffectNode } from "../binding/HitViewBinding";
import { NetworkAdapter } from "../network/NetworkAdapter";
import type { KickResponse } from "../network/ProtocolTypes";
import { ShrewType, MapType, HOLE_COUNT, HammerType } from "../ecs/types";
import { HoleComponent, PlayerComponent, HammerComponent, DirtyComponent } from "../ecs/components";
import { ShrewNode } from "./ShrewNode";
import { HoleNode } from "./HoleNode";
import { HammerNode } from "./HammerNode";
import { ComboNode } from "./ComboNode";
import { SceneLayer } from "./SceneLayer";
import { PlayerHUD } from "./PlayerHUD";
import { HitEffectNode } from "./HitEffectNode";
import { getAtlasPath } from "../resource/AtlasConfig";

/** 设计分辨率（横版，与原始 Cocos 游戏一致）*/
const DESIGN_WIDTH = 960;
const DESIGN_HEIGHT = 640;

/** 音效路径 */
const SND = {
  bg:      "resources/sound/sound_shrew/back.wav",
  hitOne:  "resources/sound/sound_shrew/Hit_One.wav",
  hitNull: "resources/sound/sound_shrew/Hit_Null.wav",
  mouse1:  "resources/sound/sound_shrew/mouse_1.wav",
};

export class GameScene {
  private _world: any;
  private _singletons!: SingletonEntities;
  private _holes: number[] = [];
  private _shrews: number[] = [];
  private _syncView: SyncView;
  private _network: NetworkAdapter;
  private _running: boolean = false;
  private _root: any = null;
  private _hammerNode!: HammerNode;
  private _hitEffectNode!: HitEffectNode;

  constructor() {
    this._syncView = new SyncView();
    this._network = new NetworkAdapter();
  }

  /** 初始化游戏 */
  init(): void {
    // 1. 创建 ECS 世界
    this._world = createGameWorld();
    this._singletons = createSingletonEntities(this._world);

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
    registerSceneLayer(this._singletons.scene, sceneLayer);

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
      registerHoleNode(holeEid, holeNode);

      // 创建地鼠视图节点（作为洞位子节点）
      const shrewNode = new ShrewNode();
      shrewNode.create(holeNode.getContainer() || this._root);
      shrewNode.setSpriteFrame(shrewType, MapType.Meadow);
      registerShrewNode(shrewEid, shrewNode);
    }

    // 5. 创建锤子光标
    this._hammerNode = new HammerNode();
    this._hammerNode.create(this._root);
    registerHammerNode(this._singletons.hammer, this._hammerNode);

    // 6. 创建玩家 HUD
    const playerHUD = new PlayerHUD();
    playerHUD.create(this._root);
    registerPlayerHUD(this._singletons.player, playerHUD);

    // 7. 创建连击特效节点
    const comboNode = new ComboNode();
    comboNode.create(this._root);
    registerComboNode(this._singletons.combo, comboNode);

    // 8. 创建击中特效节点（金币/宝箱）
    this._hitEffectNode = new HitEffectNode();
    this._hitEffectNode.create(this._root);
    // HitEffectNode 使用单例 player 实体注册（简化）
    registerHitEffectNode(this._singletons.player, this._hitEffectNode);

    // 9. 注册视图绑定
    this._syncView.registerShrewBinding(shrewViewBinding);
    this._syncView.registerAnimBinding(shrewAnimationViewBinding);
    this._syncView.registerHoleBinding(holeViewBinding);
    this._syncView.registerHammerBinding(hammerViewBinding);
    this._syncView.registerComboBinding(comboViewBinding);
    this._syncView.registerSceneBinding(sceneViewBinding);
    this._syncView.registerPlayerBinding(playerViewBinding);
    this._syncView.registerHitBinding(hitViewBinding);

    // 10. 设置网络回调
    this._network.onResponse((resp: KickResponse) => {
      hitResponseSystem(this._world, resp);
    });

    // 11. 首次全量同步（设置 forceFullSync，确保所有节点显示正确初始状态）
    const allEntities = [
      this._singletons.scene,
      this._singletons.player,
      this._singletons.hammer,
      this._singletons.combo,
      ...this._holes,
      ...this._shrews,
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

  /** 每帧更新 (由 Laya.timer.frameLoop 调用) */
  update(deltaSec: number): void {
    if (!this._running) return;

    // 1. 推进计时器
    animationTimerSystem(this._world, deltaSec);

    // 2. 地鼠状态机
    shrewStateSystem(this._world);

    // 3. 场景切换检查
    sceneCycleSystem(this._world);

    // 4. 锤子系统
    hammerSystem(this._world);

    // 5. 网络超时检查
    this._network.update();

    // 6. 脏标记
    dirtyMarkSystem(this._world);

    // 7. 视图同步
    this._syncView.sync(this._world);
  }

  /** 触摸事件处理 (由 Laya 触摸事件调用)
   *  @param x 设计坐标系中的绝对 X（stage.mouseX）
   *  @param y 设计坐标系中的绝对 Y（stage.mouseY）
   */
  onTouch(x: number, y: number): void {
    const xRatio = x / DESIGN_WIDTH;
    const yRatio = y / DESIGN_HEIGHT;
    const result = hitDetectionSystem(this._world, xRatio, yRatio);
    const Laya = (typeof (window as any).Laya !== "undefined") ? (window as any).Laya : null;

    // 锤子跟随触摸位置（使用绝对坐标）
    if (this._hammerNode) {
      this._hammerNode.followTouch(x, y);
      this._hammerNode.playHitAnimation();
    }

    if (result.bKickShrew === 1) {
      // 击中地鼠音效
      if (Laya) {
        Laya.SoundManager.playSound(SND.hitOne);
        Laya.SoundManager.playSound(SND.mouse1);
      }

      // 检查连击
      comboSystem(this._world, result.hitHoleIndex);

      // 发送网络请求
      this._network.sendKick({
        cmd: 'kick',
        hammerType: HammerComponent.selectedType[this._singletons.hammer],
        bKickShrew: result.bKickShrew,
        numOfShrew: result.numOfShrew,
        shrews: result.bKickShrew ? [{ shrewindex: result.hitHoleIndex + 1, protectType: 0 }] : [],
        comboID: 0,
      }).catch(() => {});
    } else {
      // 未击中音效
      if (Laya) Laya.SoundManager.playSound(SND.hitNull);
    }
  }

  /** 随机选择地鼠类型 */
  private _randomShrewType(): ShrewType {
    const types = [ShrewType.Red, ShrewType.Blue, ShrewType.Yellow, ShrewType.Green];
    return types[Math.floor(Math.random() * types.length)];
  }
}
