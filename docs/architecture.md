# 架构

本文说明模块职责、依赖方向、运行流和生命周期 owner。玩法组装看 `docs/gameplay-assembly.md`；具体 ECS API 看 `docs/ecs-binding.md`；Laya 细节看 `docs/laya-rules.md`。

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
  -> create EntityRuntime / ProjectionRuntime / EffectRuntime
  -> bootstrap singleton entities
  -> GAME_FEATURE_REGISTRY.setupAll
  -> setupGameSession provides cross-feature capabilities
  -> create per-scene GameFeatureRuntime
  -> projectionRuntime.mark/sync initial state
```

每帧：

```text
state systems
network.update
feature systems
projectionRuntime.mark
projectionRuntime.sync
effectRuntime.flush
```

## 网络与输入

点击：

```text
Main -> GameScene -> KickInputController
  -> detectKickHit
  -> Shrew: NetworkAdapter.sendKick
  -> Monster: local hp/reward/triad release
```

命中检测不以 Hole 作为唯一目标入口。Hammer 点击位置会和当前可命中的 Shrew、Monster 的 `BoardPositionComponent` 中心比较，选择半径内最近目标。Shrew 候选必须仍是对应 Hole 的 current occupant；Monster 候选看自己的 visible、hp 和 Stay 状态。不存在“先 Monster 后 Shrew”的命中优先级分支，互斥已经由洞占用保证。

回包：

```text
NetworkAdapter callback
  -> KickResponseHandler
  -> Player/Hammer public mutation helpers
  -> activateHammerThunderIfCharged cross-feature orchestration
  -> HitRewardEffect emit
  -> frame-end flush
  -> HitEffectNode
```

本地 miss 由 `KickInputController` 显式 emit `HitMissEffect`。

## 生命周期 owner

- `Main`：frameLoop、stage event、背景音乐。
- `GameScene`：world、三个 runtime、network 和 root。
- `Feature`：本业务的拓扑、对象池、节点和 effect handler。
- `ViewRegistry`：集中 destroy 由 mount/own 注册的 view/resource。
- 具体 Node：自己的 children、timer、tween 和 async callback guard。

退出顺序：

```text
network.destroy
ViewRegistry.clear
EffectRuntime.clear
ProjectionRuntime.clear
EntityRuntime.clear
deleteWorld
```

下一次进入重新创建全部状态、快照和 view。

## 扩展点

新增业务采用纵向切片：Component、Entity、System、Projection、contract、Node 和配置放在 `src/game/features/foo`，只从 `index.ts` 暴露公开能力，并在 `src/game/GameFeatures.ts` 增加显式注册项。

框架负责 registry、dirty bit、full sync 和 teardown。业务不维护这些机制，也不依赖运行期频繁 `removeEntity`。具体写法见 `docs/ecs-binding.md`。

## 命名与归位

命名优先回答“谁负责什么”，其次才考虑缩短字符数。

- 框架文件使用稳定机制名：`GameWorld`、`FeatureSetupContext`、`ViewMounting`。避免用 `World`、`RuntimeContext`、`Primitives` 这类过宽或偏内部实现的名字。
- 业务切片文件使用业务归属名：`MapCycleSystem`、`HammerThunderSystem`、`PerfRuntimeConfig`。跨 Feature 编排放在 `game/session`，不要伪装成某个 Feature 的内部 system。
- 只有进入 frame pipeline 的函数使用 `System` 后缀。一次输入、回包或判断动作使用动词名，例如 `detectKickHit`、`handleKickResponse`、`applyKickResponse`。
- Laya 节点接口使用 `I*Node`；HUD 这类稳定缩写保持全大写，例如 `PlayerHUDFeature`、`PlayerHUDViewConfig`。
- 系统注册名和文件/函数语义保持一致，例如 `board.mapCycle`、`session.hammerThunder`。不要让测试快照继续保留旧概念。
- 测试放在被保护边界旁边：框架机制放 `src/tests/ecs`、`src/tests/sync`、`src/tests/features`；业务规则放 `src/tests/game/features/<name>`；输入和回包放 `src/tests/game/session`。
