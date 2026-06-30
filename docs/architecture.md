# 架构

本文说明模块职责、依赖方向、运行流和生命周期 owner。具体 ECS API 看 `docs/ecs-binding.md`；Laya 细节看 `docs/laya-rules.md`。

## 模块职责

```text
src/framework/            稳定的 ECS / Feature / Sync / View 机制
src/game/features/        业务纵向切片
src/game/session/         输入、回包和跨 Feature 编排
src/game/GameFeatures.ts  显式 Feature 组合根
src/app/                  Laya 应用壳和主循环
src/network/              protobuf、socket、mock server
src/resource/             atlas、plist 和资源路径工具
src/config/               少量跨业务配置
```

`framework` 提供机制。`game/features` 保存业务规则和表现绑定。`app` 负责把 world、runtime、network 和 Laya stage 组装起来。

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
- Feature 不导入另一个 Feature 的内部文件。

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

`ShrewFeature` 显式保留业务拓扑：

1. mount Scene。
2. 创建 9 个 Hole。
3. 每个 Hole 创建一个 Shrew。
4. 写入 `HoleComponent.shrewEid`。
5. ShrewNode 以 HoleNode container 为 parent。

这个关系是玩法事实，不进入通用 EntityRuntime helper。

## 启动和主循环

进场：

```text
GameScene.init
  -> createGameWorld
  -> create EntityRuntime / ProjectionRuntime / EffectRuntime
  -> bootstrap singleton entities
  -> GAME_FEATURE_REGISTRY.setupAll
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
  -> NetworkAdapter.sendKick
```

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
- 系统注册名和文件/函数语义保持一致，例如 `shrew.mapCycle`、`session.hammerThunder`。不要让测试快照继续保留旧概念。
- 测试放在被保护边界旁边：框架机制放 `src/tests/ecs`、`src/tests/sync`、`src/tests/features`；业务规则放 `src/tests/game/features/<name>`；输入和回包放 `src/tests/game/session`。
