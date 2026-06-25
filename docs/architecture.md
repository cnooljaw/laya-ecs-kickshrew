# 架构说明

## 模块

```text
src/
  ecs/components/       bitecs component schema
  ecs/gameplay/         业务状态、EntityType、纯 systems
  ecs/runtime/          EntityRuntime
  sync/projection/      ProjectionDefinition / ProjectionRuntime
  sync/projections/     业务投影声明
  sync/contracts/       view contracts
  effects/              typed EffectDefinition / EffectRuntime
  features/             薄装配层
  view/                 Laya 节点、输入、GameScene 和主循环
  network/              protobuf、socket、mock server
  config/               静态配置
```

## 依赖方向

```text
input/network
  -> adapter
  -> ECS system/domain helper
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

- 初始化时编译 Feature 声明的 `EntityType[]`。
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
defineGameFeature({
  name,
  entities,
  projections,
  systems: { state, feature },
  setup(context) {},
});
```

`setup` 可以创建固定拓扑、池、节点和 effect handler。核心规则必须留在 `ecs/gameplay`。

CoreGameplayFeature 显式保留：

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
Main -> GameScene -> KickInputAdapter
  -> hitDetectionSystem
  -> NetworkAdapter.sendKick
```

回包：

```text
NetworkAdapter callback
  -> KickResponseAdapter
  -> hitResponseSystem updates Player/Hammer
  -> HitRewardEffect emit
  -> frame flush
  -> HitEffectNode
```

本地 miss 由 KickInputAdapter 显式 emit `HitMissEffect`。

## 生命周期

Owner：

- `Main`：frameLoop、stage event、背景音乐。
- `GameScene`：world、三个 runtime、network 和 root。
- `Feature`：本领域拓扑、池、节点和 effect handler。
- `ViewRegistry`：集中 destroy 所有拥有的 view/resource。
- `view/*Node`：自己的 children、timer、tween 和异步回调保护。

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

1. 定义 component。
2. 定义 EntityType。
3. 写纯 system。
4. 持久可见状态定义 Projection；瞬时事实定义 Effect。
5. 在 Feature 声明 entities/systems/projections 并装配真实拓扑。
6. 补实体、规则、投影/effect 和生命周期测试。

不要修改全局 registry，不要维护 dirty bit，不要依赖频繁 `removeEntity`。
