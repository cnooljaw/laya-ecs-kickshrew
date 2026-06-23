# 架构说明

本文说明项目模块边界、运行流和后续重构方向。每次需要理解“代码应该放哪里”“谁拥有生命周期”“一个输入怎么流到画面”时读这里。

## 项目结构

```text
src/
  Main.ts                 Laya 脚本入口
  ecs/                    bitecs world、components、systems
  sync/                   dirty bit 协议和表格式同步规则
  binding/                ECS -> Laya 节点的 dirty binding
  view/                   Laya 节点封装、运行时装配和输入适配
  network/                协议、KickSocket、NetworkAdapter、MockServer
  resource/               atlas/plist 转换与资源路径映射
  config/                 地图、洞位、规则和表现配置
  tests/                  Vitest 测试

src1/                     老 Lua/Cocos 参考实现，不是当前运行主线
assets/                   Laya 工程资源
bin/                      浏览器运行和调试入口、运行资源
docs/                     项目知识库
```

## 分层边界

```text
Laya 入口层
  Main.ts

运行时装配层
  view/GameScene.ts
  view/GameLoopPipeline.ts
  view/KickInputAdapter.ts
  view/ViewRegistry.ts

纯游戏状态/规则层
  ecs/components
  ecs/gameplay/*/*
  ecs/types

表现同步层
  sync/contracts/*ViewContract.ts
  sync/DirtyFlags.ts
  sync/DirtyTargets.ts
  sync/rules/*ViewRules.ts
  sync/rules/*SyncRules.ts
  binding/SyncView.ts
  binding/*ViewBinding.ts

功能扩展层
  features/GameFeature.ts
  features/GameFeatures.ts
  features/*/*Feature.ts

Laya 表现层
  view/*Node.ts

网络协议层
  api/proto/kick.proto
  network/KickProtoCodec.ts
  network/ProtocolTypes.ts
  network/KickSocket.ts
  network/NetworkAdapter.ts
  network/MockServer.ts

资源工具层
  resource/AtlasConfig.ts
  resource/PlistConverter.ts
  resource/convertAll.ts
  resource/rebuild-atlases.ts

配置层
  config/*.ts
```

依赖方向：

```text
input/network/resource callback
  -> command/event adapter
  -> ECS systems / domain helpers
  -> DirtyComponent
  -> SyncView channel
  -> binding projection
  -> Laya view nodes
```

不要让 ECS system 直接操作 Laya 节点。不要让 Laya 节点直接改权威游戏规则。socket 回包应先转成系统可消费的数据，再更新 ECS。

新增独立玩法实体采用“ECS gameplay + 薄 Feature”边界。玩法权威状态、系统、工厂和 dirty aspect 放 `src/ecs/gameplay/<domain>/`；配置放 `src/config/`；同步规则放 `src/sync/rules/`；binding 放 `src/binding/`；Laya 节点放 `src/view/`。`src/features/<domain>/*Feature.ts` 只负责把这些能力装配进游戏，`GameScene` 只通过 `GAME_FEATURE_REGISTRY` 接入。

## 启动和主循环

```text
Main.ts
  -> new GameScene()
  -> GameScene.init()
  -> GameScene.start()
  -> Laya.timer.frameLoop(...)
  -> GameScene.update(delta)
  -> GameLoopPipeline.update(delta)
```

`GameScene.init()` 负责装配：

```text
createGameWorld()
createSingletonEntities()
GAME_FEATURE_REGISTRY.setupAll(...)
  -> Feature 创建自己的 ECS 实体和 Laya 节点
  -> Feature 通过 ViewRegistry 注册 eid/node
syncView.registerChannels(GAME_FEATURE_REGISTRY.syncChannels())
network.onResponse(resp => hitResponseSystem(world, resp))
new GameLoopPipeline(featureRegistry)
new KickInputAdapter(...)
forceFullSync Feature 上报的初始实体
syncView.sync(world)
```

`GameLoopPipeline.update(deltaSec)` 的系统顺序：

```text
featureRegistry.systemsByPhase("state")
network.update()
featureRegistry.systemsByPhase("feature")
dirtyMarkSystem(world, featureRegistry.dirtyAspects())
syncView.sync(world)
```

这个顺序的含义是：先推进核心规则和状态，再处理独立 Feature 系统，再标记 dirty，最后把变化投影到 Laya 节点。`GameLoopPipeline` 不再手写具体 system 列表，只按 phase 执行 FeatureRegistry 汇总出的系统。

## 点击流程

```text
Laya stage MOUSE_DOWN
  -> Main._onTouch()
  -> GameScene.onTouch(x, y)
  -> KickInputAdapter.handleTouch(x, y)
      -> 设计坐标转比例
      -> hitDetectionSystem(world, xRatio, yRatio)
      -> HammerNode.followTouch/playHitAnimation
      -> NetworkAdapter.sendKick(...)
          -> KickSocket.sendKick(...) protobuf encode/send
          -> MockServer.handleKick(...)（本地 mock 先 protobuf decode，回包再 encode）
          -> KickSocket.onMessage(...) protobuf decode
          -> hitResponseSystem(world, resp)
```

输入适配器负责把 Laya 输入转换成 ECS/网络命令，避免 `GameScene` 继续膨胀。

## 地鼠状态机

当前状态：

```text
Wait -> Up -> Stand -> Down -> Wait
Dizzy(被击中短暂停留) -> Wait
```

`None/Refresh/Delay` 已移除。下一轮重置统一走 `src/ecs/gameplay/core/ShrewLifecycle.ts` 的 `resetShrewForNextCycle()`，命中短暂停留统一走 `startShrewDizzyHold()`。

自然循环：

```text
Wait 随机等待
  -> Up 出洞动画
  -> Stand 可点击停留
  -> Down 入洞动画
  -> resetShrewForNextCycle()
  -> Wait
```

命中循环：

```text
HitDetectionSystem
  -> startShrewDizzyHold()
  -> Dizzy
  -> resetShrewForNextCycle()
  -> Wait
```

`ShrewStateSystem` 和 `AnimationTimerSystem` 都使用 `GameScene.update(deltaSec)` 传入的真实帧间隔，不再依赖固定 60fps。

## 网络边界

`KickSocket` 负责：

- `seqId` 自增。
- protobuf `KickRequest/KickResponse` 二进制编解码。
- pending request 保存。
- 乱序回包匹配。
- 超时清理。

`NetworkAdapter` 是运行时桥接：

- 默认用 `MockServer`。
- 真实 socket 接入时优先替换 `ISocketTransport`。
- 回包进入 `hitResponseSystem`，不要直接操作 view。

协议文件同步入口见 `AGENTS.md` 的“协议同步和更新”。

## 生命周期边界

当前 owner：

- `Main`：Laya `frameLoop`、stage 事件、脚本生命周期。
- `GameScene`：world、singletons、运行时 adapter、view registry、network callback、FeatureRegistry 调用。
- `Feature`：声明本模块的 system phase、dirty aspect、sync channel，并在 setup 中创建/注册本模块节点。
- `ViewRegistry`：ECS eid 和 view node 的注册关系，集中 unregister 和 destroy。
- `view/*Node.ts`：自己创建的 Laya 子节点、timer/tween/异步资源回调保护。

性能压测中的 Spine 池是特殊共享表现资源：`PerfHeroFeature` 在 setup 中创建 `PerfHeroSpinePoolGroup` 并交给运行时 refs，单个 `PerfHeroNode` 只持有当前 active 实例，`ViewRegistry` 仍负责节点销毁和 binding unregister。

### world 和 entity 生命周期

当前主线是一局游戏一个 bitecs world：

```text
GameScene.init()
  -> createGameWorld()
  -> createSingletonEntities(world)
  -> GAME_FEATURE_REGISTRY.setupAll(...)
  -> Feature 创建自己的实体和 ViewRegistry 注册关系
```

`createGameWorld()` 只创建空 world。真正的游戏状态来自 `world.ts` 里创建的几类 entity：

- 单例 entity：`hammer`、`scene`、`player`、`network`。
- 洞位 entity：9 个 `HoleComponent`，保存行列、坐标比例、zIndex、`shrewEid`。
- 地鼠 entity：挂 `ShrewComponent`、`AnimationComponent`、`DirtyComponent`。
- 压测 entity：`PerfHeroComponent` 只服务 perf 调试链路。

不要把“每次出洞”实现成不断 `addEntity`。地鼠的自然循环、命中、下一轮等待都通过重置 `ShrewComponent` / `AnimationComponent` 字段完成，例如 `resetShrewForNextCycle()`。这样 eid 数量稳定，dirty snapshot 也稳定。

如果后续引入真正的动态 entity，例如一个区别于地鼠的新怪物，生命周期按下面顺序处理：

```text
createXxxEntity(world)
  -> addComponent(... XxxComponent)
  -> addComponent(... DirtyComponent)
  -> registerXxxNode(eid, node)
  -> system 用 ageSec / visible / state 管生命周期
  -> dirty binding 同步表现
  -> 结束时优先复用；必须删除时先 unregister/destroy view，再 removeEntity(world, eid)
```

动态删除时还要同步处理 dirty snapshot，避免旧 eid 快照影响后续复用。表现节点不能自己决定规则上的消失；10 秒后消失这类规则应由 ECS system 改 `visible/state` 字段，再由 dirty binding 通知 View。

## 扩展入口

- 改状态机：`src/ecs/gameplay/core/ShrewStateSystem.ts`、`src/ecs/gameplay/core/ShrewLifecycle.ts`
- 改命中规则：`src/ecs/gameplay/core/HitDetectionSystem.ts`、`src/view/KickInputAdapter.ts`
- 改地图/洞位：`src/config/HolePositions.ts`、`src/config/SceneConfig.ts`、`src/ecs/gameplay/core/SceneCycleSystem.ts`
- 改锤子/怒气：`src/ecs/gameplay/hammer/HammerSystem.ts`、`src/config/HammerConfig.ts`、`src/view/HammerNode.ts`
- 接真实服务器：`src/network/KickSocket.ts`、`src/network/NetworkAdapter.ts`、`src/ecs/gameplay/hud/HitResponseSystem.ts`
- 做性能压测：`src/config/PerfTestConfig.ts`、`src/config/ViewLayoutConfig.ts`、`src/ecs/gameplay/perfHero/PerfHeroSystem.ts`、`src/view/PerfHeroNode.ts`、`docs/performance-tuning.md`

## 架构原则

- 权威状态放 ECS，Laya 节点只表现。
- 输入、网络回包、资源回调先转成 command/event，再进入规则或 adapter。
- 新增复杂逻辑优先下沉到可测试模块，不塞进 `GameScene`。
- 视图同步依赖 dirty binding，不用 `forceFullSync` 掩盖常规同步缺口。
- 异步加载、timer、tween、event 都要有 owner 和 teardown。
