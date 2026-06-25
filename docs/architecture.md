# 架构说明

## 模块

```text
src/
  framework/            稳定 ECS / Feature / Sync / View 机制
  game/features/        业务纵向切片
  game/session/         跨 Feature 编排
  game/GameFeatures.ts  显式组合根
  app/                  Laya 应用壳和主循环
  network/              protobuf、socket、mock server
  resource/             通用资源工具
  config/               真正跨业务的少量配置
```

## 依赖方向

```text
input/network
  -> game/session
  -> feature system/domain helper
  -> component
  -> projection
  -> view contract
  -> Laya node
```

瞬时表现走独立通道：

```text
adapter -> EffectRuntime.emit -> frame flush -> Feature handler -> Laya node
```

ECS system 不操作 Laya。View node 不反查 ECS，也不决定规则。

## 三个运行时

### EntityRuntime

- 初始化时编译 Feature 声明的 `EntityDefinition[]`。
- `bootstrapSingletons()` 创建 Scene、Hammer、Player 等单例。
- `create/createMany` 创建固定拓扑和池。
- 运行期通常不删除 entity；退出 world 时整批释放。

### ProjectionRuntime

- 初始化时编译 query、watched fields、row offsets、typed dirty/full arrays 和 eid/node registry。
- 第一次看到 eid 时建立一次 snapshot 并全量投影。
- 后续只比较声明字段，按变化 row 调用 view contract。
- 相同 apply 函数在同一轮只执行一次。

### EffectRuntime

- 用 `EffectDefinition` 对象身份区分 channel，不使用全局字符串总线。
- `emit` 只入队；`flush` 在帧末派发。
- 用于 reward、miss 等瞬时事实，不伪装成持久 ECS 状态。

## Feature

Feature 只声明：

```ts
defineFeature({
  name,
  entities,
  projections,
  systems: [defineSystem(phase, name, run)],
  setup(context) {},
});
```

`setup` 可以创建固定拓扑、池、节点和 effect handler。核心规则保留在拥有它的业务切片。

ShrewFeature 显式保留：

1. mount Scene。
2. 创建 9 个 Hole。
3. 每个 Hole 创建一个 Shrew。
4. 写 `HoleComponent.shrewEid`。
5. ShrewNode 以 HoleNode container 为 parent。

这个关系是业务，不进入通用 EntityRuntime helper。

## 启动和主循环

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
  -> hitDetectionSystem
  -> NetworkAdapter.sendKick
```

回包：

```text
NetworkAdapter callback
  -> KickResponseFlow
  -> Player/Hammer public mutation helpers
  -> ThunderSystem cross-feature orchestration
  -> HitRewardEffect emit
  -> frame flush
  -> HitEffectNode
```

本地 miss 由 KickInputController 显式 emit `HitMissEffect`。

## 生命周期

Owner：

- `Main`：frameLoop、stage event、背景音乐。
- `GameScene`：world、三个 runtime、network 和 root。
- `Feature`：本领域拓扑、池、节点和 effect handler。
- `ViewRegistry`：集中 destroy 所有拥有的 view/resource。
- 各 Feature 的具体 Node：自己的 children、timer、tween 和异步回调保护。

退出顺序：

```text
network.destroy
ViewRegistry.clear
EffectRuntime.clear
ProjectionRuntime.clear
EntityRuntime.clear
deleteWorld
```

下一次进入重新创建全部状态和快照。

## 新增业务

1. 创建 `src/game/features/foo`。
2. 在切片内定义 Component、Entity、System、Projection、contract、Node 和配置。
3. 在 `FooFeature` 使用小型装配原语。
4. 只从 `index.ts` 暴露公开能力。
5. 在 `src/game/GameFeatures.ts` 增加显式注册项。
6. 补实体、规则、投影/effect 和生命周期测试。

不要修改全局 registry，不要维护 dirty bit，不要依赖频繁 `removeEntity`。
