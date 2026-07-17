# 架构

本文说明模块职责、依赖方向、运行流和生命周期 owner。玩法组装看 `docs/gameplay-assembly.md`；具体 ECS API 看 `docs/ecs-binding.md`；Laya 细节看 `docs/laya-rules.md`。理解本项目函数优先、数据驱动、组合和依赖注入的取舍，看 `docs/typescript-architecture.md`。

## 模块职责

```text
src/framework/            稳定的 ECS / Feature / Sync / View 机制
src/game/board/           棋盘基础层：Scene、Hole、BoardPosition、拓扑和占用操作
src/game/features/        业务纵向切片
src/game/session/         输入、回包和跨 Feature 编排
src/game/GameFeatures.ts  显式 Feature 组合根
src/app/                  Laya 应用壳和主循环
src/network/              protobuf、socket、mock server
src/resource/             atlas、plist 和资源路径工具
src/config/               少量跨业务配置
```

`framework` 提供机制。`game/board` 保存稳定棋盘基础能力。`game/features` 保存业务规则和表现绑定。`app` 负责把 world、runtime、network 和 Laya stage 组装起来。

跨模块引用看两个入口：

- `index.ts`：公开契约。给 `session`、其他 Feature 和调试入口使用，只暴露真正需要的能力。
- `assembly.ts`：装配材料。仅给 `GameFeatures.ts` 和真实装配测试使用，暴露 Feature manifest、Entity、Projection 和低层 Component。

## 依赖方向

持久状态：

```text
input/network
  -> game/session
  -> feature system/domain helper
  -> component
  -> projection
  -> I* 接口
  -> Laya node
```

瞬时事实：

```text
adapter
  -> EffectRuntime.emit
  -> frame-end flush
  -> Feature handler
  -> Laya node
```

规则：

- ECS system 不操作 Laya。
- Laya node 不反查 ECS。
- socket 回包不直接操作 view。
- Feature 不导入另一个业务 Feature 的内部文件。
- Feature 可以依赖 `game/board` 公开 API；board 不依赖任何业务 Feature。

## 运行时

### EntityRuntime

- 初始化时编译 Feature 声明的 `EntityDefinition[]`。
- `bootstrapSingletons()` 创建 Scene、Hammer、Player 等单例。
- `create/createMany` 创建固定拓扑和对象池。
- 运行期通常不删除 entity；退出 world 时整批释放。

### ProjectionRuntime

- 初始化时编译 query、watched fields、row offsets、dirty/full arrays 和 eid/node registry。
- 首次看到 eid 时创建 snapshot，并全量同步。
- 后续只比较声明字段，按变化 row 调用 `I*` 接口。
- 同一轮内相同 apply 函数只执行一次。

### EffectRuntime

- 用 `EffectDefinition` 对象身份区分 channel。
- `emit` 只入队；`flush` 在帧末派发。
- 用于 reward、miss 等瞬时事实，不伪装成持久 ECS 状态。

## Feature

Feature 声明自己贡献的实体、投影、系统和 setup：

```ts
defineFeature({
  name,
  entities,
  projections,
  systems: [defineSystem(phase, name, run)],
  setup(context) {},
});
```

`setup` 可以创建固定拓扑、对象池、节点和 effect handler。核心规则保留在拥有它的业务切片。
常见单例视图优先使用 `ctx.mountSingleton({ entity, projection, create })`；
常见固定输入池优先使用 `ctx.createAndMountMany({ entity, inputs, projection, create })`。
父子拓扑、规则校验、trigger 创建和跨实体关系仍应在 Feature setup 中显式表达。

`BoardFoundation` 拥有基础棋盘拓扑：

1. mount Scene。
2. 创建 9 个 Hole。
3. 维护地图轮换、洞位坐标、洞位 zOrder。
4. 维护 `residentKind/residentEid` 和 `occupantKind/occupantEid`。
5. provide `BoardTopologyCapability`，供其他 Feature 使用 `BoardTopology` 和 `BoardOps` 绑定或占用洞位。

`ShrewFeature` 只创建 Shrew，并通过 `bindResident(board, index, BoardOccupantKind.Shrew, shrewEid)` 建立 1:1 默认住户关系。`ShrewNode` 挂在 root，由 `BoardPositionComponent` 投影自己的位置和 zOrder。它不拥有 HoleNode，也不直接写洞位坐标。

`MonsterFeature` 使用固定实体池。`session` 把 PlayerHUD 的 money 映射成 `MonsterSpawnMilestoneCapability`，Monster 只消费当前规则里程碑。里程碑增加时，它从 board 查找空闲三角形洞位，调用 `tryOccupyTriad(board, triad, BoardOccupantKind.Monster, monsterEid)` 原子占用 3 个 Hole，并把 Monster 放在三角形中心。没有可用三角形时跳过本次刷怪，不挤掉已有 Shrew 或 Monster。

洞位互斥由 `HoleComponent.occupantKind/occupantEid` 表达。Shrew 是 resident；Monster 是临时 occupant。Monster 占用三洞后，这三个洞的 resident Shrew 仍存在，但不再是 current occupant，因此不会参与命中候选。Monster 释放时只把 occupant 恢复为 resident。

## 启动和主循环

进场：

```text
GameScene.init
  -> createGameWorld
  -> create EntityRuntime
  -> bootstrap singleton entities
  -> create ProjectionRuntime / EffectRuntime
  -> create per-scene GameIngressQueue
  -> GAME_FEATURE_REGISTRY.setupAll
     -> feature.setup provide/use setup capability
     -> setupGameSession provide cross-feature capability
     -> feature.setupSystems capture capability
     -> return per-scene GameFeatureRuntime
  -> projectionRuntime.mark/sync initial state
```

每帧：

```text
network.update
featureRuntime.systemsByPhase("ingress")
featureRuntime.systemsByPhase("state")
featureRuntime.systemsByPhase("gameplay")
featureRuntime.systemsByPhase("derived")
optional scene-owned rebuild
projectionRuntime.mark
projectionRuntime.sync
effectRuntime.flush
```

`GameFeatureRegistry` 只负责静态声明和 setup，不再暴露 `systemsByPhase`。需要进入帧循环的系统必须从 `setupAll` 返回的 `GameFeatureRuntime` 获取，因为只有 setup 后才能拿到 `BoardTopologyCapability`、`MonsterSpawnMilestoneCapability` 这类场景级能力。

`GameFeatureRuntime.schedule()` 提供只读的调度计划，按真实执行顺序展开：先 `ingress`，再 `state`、`gameplay`、`derived`，同一 phase 保持注册顺序。它用于调试和测试，不是运行期增删 System 的入口。

`ClientDiagnostics` 是 Laya Stat、Heap 面板、`FrameDiagnostics` 和 `RuntimeDiagnosticsPanel` 的生命周期 owner。它内部的单一硬编码开关默认关闭；关闭时 `GameScene` 不接收 `FrameDiagnostics`，`GameLoopPipeline` 直接执行原始帧循环。开启时才记录整帧、每个 System 与 network / Projection / Effect 步骤的耗时，并在主调试页显示当前 schedule 和最近一帧的慢步骤。先用它和 profiling 判断性能瓶颈，不为消除 phase 与 system 的两层循环提前重写 Pipeline。

阶段职责固定：

- `ingress`：消费已经到达的网络事实，按入队顺序写入权威 Component。
- `state`：推进时间轴、状态机、冷却等持续状态。
- `gameplay`：执行生成、命中、占用等会改变玩法关系的规则。
- `derived`：根据本帧已完成的玩法关系计算派生状态，例如洞位占用后的 Shrew/Monster 位置与阻塞状态、雷神锤激活条件。

`GameLoopPipeline.requestRebuild()` 只供 scene/session runtime 请求一次结构重建。它在 `derived` 后、Projection 前消费；Feature 不持有该 API，业务也不写全局 dirty 标记。当前它是世界整体恢复或未来动态拓扑的预留入口，不替代 `ProjectionRuntime` 的字段比较。

## 网络与输入

点击：

```text
Main -> GameScene -> KickInputController
  -> detectKickHit
  -> Shrew: NetworkAdapter.sendKick
  -> Monster: local hp/reward/triad release
```

网络 callback 不直接写 world：

```text
NetworkAdapter callback
  -> GameIngressQueue enqueue
  -> ingress phase FIFO drain
  -> session/server-sync applier
  -> Component
```

`GameScene` 拥有这条 per-scene queue，并在 destroy 时 clear。这样 snapshot、timeline、state push、map push、time sync 和 kick response 都只在确定的帧边界更新权威状态；View 仍然只由后续 Projection 和 Effect 驱动。

命中检测不以 Hole 作为唯一目标入口。Hammer 点击位置会和当前可命中的 Shrew、Monster 的 `BoardPositionComponent` 中心比较，选择半径内最近目标。Shrew 候选必须仍是对应 Hole 的 current occupant；Monster 候选看自己的 visible、hp 和 Stay 状态。不存在“先 Monster 后 Shrew”的命中优先级分支，互斥已经由洞占用保证。

回包：

```text
NetworkAdapter callback
  -> GameIngressQueue enqueue
  -> ingress phase FIFO drain
  -> KickResponseHandler / server-sync applier
  -> Player/Hammer public mutation helper
  -> Component / HitRewardEffect emit
  -> derived: activateHammerThunderIfCharged
  -> ProjectionRuntime mark/sync
  -> frame-end flush
  -> HitEffectNode
```

这里的 `KickResponseHandler` 只在 ingress drain 中执行；它不从网络 callback 直接写 world，也不直接调用派生规则。雷神锤是否激活由同帧 `derived` system 根据已经写入的 Component 计算。本地 miss 则由 `KickInputController` 显式 emit `HitMissEffect`。

## 生命周期 owner

- `Main`：frameLoop、stage event、背景音乐。
- `ClientDiagnostics`：可选的 Laya Stat、Heap 面板、帧诊断和调度面板。
- `GameScene`：world、三个 runtime、network、per-scene ingress queue 和 root。
- `Feature`：本业务的拓扑、对象池、节点和 effect handler。
- `ViewRegistry`：集中 destroy 由 mount/own 注册的 view/resource。
- 具体 Node：自己的 children、timer、tween 和 async callback guard。

退出顺序：

```text
network.destroy
GameIngressQueue.clear
ViewRegistry.clear
EffectRuntime.clear
ProjectionRuntime.clear
EntityRuntime.clear
deleteWorld
GameSceneRoot.destroy
```

`GameScene.init()` 任一步失败也走同一套清理顺序并重新抛出异常。Feature setup 不能留下半挂载的 Node、Effect handler、snapshot 或 world；调用者应创建新的 `GameScene` 再尝试进入。

下一次进入重新创建全部状态、快照和 view。

## 扩展点

新增业务采用纵向切片：Component、Entity、System、Projection、contract、Node 和配置放在 `src/game/features/foo`。跨模块能力从 `index.ts` 暴露；组合根材料从 `assembly.ts` 暴露，并在 `src/game/GameFeatures.ts` 增加显式注册项。测试具体规则时直接 import 被测文件，不把 `assembly.ts` 当通用入口。

框架负责 registry、dirty bit、full sync 和 teardown。业务不维护这些机制，也不依赖运行期频繁 `removeEntity`。具体写法见 `docs/ecs-binding.md`。

## 条件式架构待办

本节记录已经识别、但**当前不应提前实现**的架构事项。没有满足进入条件时，保持现有 Feature、`GameScene`、固定槽位和显式注册模型，不为“通用性”改造。

| 事项 | 进入条件 | 满足后要做什么 | 未满足时 |
| --- | --- | --- | --- |
| `SceneAssetScope` | 出现至少两种可重复进入的地图/场景，且资源需要预加载或主动释放；或已经复现资源回调落到旧场景、Spine/音频未释放、切场卡顿 | 由 app 层 scope acquire、持有、cancel/release 场景资源；异步回调检查 scope 仍有效 | Node 继续按 `ViewRegistry` 和自身 stale guard 管理资源，不新增全局 ResourceManager。 |
| `GameEntryFlow` | 进入游戏必须编排两个以上可失败的异步步骤，例如资源预加载、登录/匹配、快照追赶；并且需要取消、重试或错误恢复 | 在 `src/app` 建立显式阶段：`createRuntime -> preloadAssets -> setupFeatures -> requestSnapshot -> initialProjection -> running` | 保持 `GameScene.init()`；不要用 Notification/EventBus 串联启动步骤。 |
| 配置加载与统一校验 | 至少两个业务切片改为外部内容表驱动，且内容修改者不能依赖改 TypeScript；或已出现配置引用错误在运行期才暴露 | 建立类型化 decode 和 `validateGameAssembly()`，校验资源路径、地图拓扑、对象池基数、规则引用和 capability 关系 | 保持 TypeScript 配置和各切片局部 `validate*` 函数。 |
| `PanelNavigator` | 出现登录、大厅、背包、任务、商店等多个独立 Panel，且需要模态层、返回栈、预加载或复用 | 在 `src/app/ui` 管理 Panel open/close/stack 与 `SceneAssetScope`；只拥有表现状态 | HUD、命中特效和场景 Node 继续由所属 Feature 与 `ViewRegistry` 管理。 |
| 按活跃对象动态启停 System | `FrameDiagnostics` 已证明某组 System 在目标设备上长期无活跃实体且构成可测瓶颈 | 只对整组 Feature / mode 增加显式启停，保留 schedule 可见性与测试 | 不给每个 System 添加 `enabled` / `shouldRun`，不因双层循环提前优化。 |

明确不纳入待办：全局 `NotificationCenter`、`WorldManager` 式 Service Locator、业务 System 直接访问 Laya Node、自动扫描 Feature、反射注册。这些会破坏当前的依赖方向、场景级生命周期 owner 或确定的帧时序。

## 命名与归位

命名优先回答“谁负责什么”，其次才考虑缩短字符数。

- 框架文件使用稳定机制名：`GameWorld`、`FeatureSetupContext`、`ViewMounting`。避免用 `World`、`RuntimeContext`、`Primitives` 这类过宽或偏内部实现的名字。
- 业务切片文件使用业务归属名：`MapCycleSystem`、`HammerThunderSystem`、`PerfRuntimeConfig`。跨 Feature 编排放在 `game/session`，不要伪装成某个 Feature 的内部 system。
- 只有进入 frame pipeline 的函数使用 `System` 后缀。一次输入、回包或判断动作使用动词名，例如 `detectKickHit`、`handleKickResponse`、`applyKickResponse`。
- Laya 节点接口使用 `I*Node`；HUD 这类稳定缩写保持全大写，例如 `PlayerHUDFeature`、`PlayerHUDViewConfig`。
- 系统注册名和文件/函数语义保持一致，例如 `board.mapCycle`、`session.hammerThunder`。不要让测试快照继续保留旧概念。
- 测试放在被保护边界旁边：框架机制放 `src/tests/ecs`、`src/tests/sync`、`src/tests/features`；业务规则放 `src/tests/game/features/<name>`；输入和回包放 `src/tests/game/session`。
