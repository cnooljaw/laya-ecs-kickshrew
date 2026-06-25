# LayaAir3 项目入门

## 目标

本项目用 bitecs 保存权威游戏状态，用 LayaAir3 表现画面。框架层提供：

- `EntityRuntime`：创建单例、固定拓扑和对象池。
- `ProjectionRuntime`：把 component 字段变化差量同步到 view contract。
- `EffectRuntime`：派发 reward/miss 等瞬时表现事实。
- `FeatureRuntimeContext`：隐藏 root、node ownership 和 runtime registry。

## 先跑起来

```bash
npm install
npm test
npx tsc --noEmit
npm run debug:ready
```

打开：

```text
http://localhost:8080/debug-tsc.html
```

## 目录

```text
src/ecs/components       component schema
src/ecs/gameplay         EntityDefinition 和纯系统
src/ecs/runtime          EntityRuntime
src/sync/projection      通用投影框架
src/sync/projections     业务投影
src/sync/contracts       view contract
src/effects              typed effects
src/features             业务装配
src/view                 Laya 节点和运行时
src/network              protobuf/socket/mock
src/config               配置
```

## 从入口读代码

```text
Main
  -> GameScene.init
  -> compile runtimes
  -> GAME_FEATURE_REGISTRY.setupAll
  -> GameLoopPipeline.update
```

每帧：

```text
state systems
network
feature systems
projection mark
projection sync
effect flush
```

## ECS

Component 是结构化 typed arrays。EntityDefinition 声明组件组合和初始化：

```ts
const SceneEntity = defineEntity({
  name: "scene",
  components: [SceneComponent],
  cardinality: "one",
  initialize(eid) {},
});
```

游戏运行期优先修改 component 状态而不是删除 entity：

- 地鼠循环重置同一个 Shrew eid。
- Monster 到期设置 `visible=0`。
- PerfHero 使用固定槽位和 Spine 池。

退出 GameScene 时删除整个 world，重新进入时重新创建。

## Projection

Projection 将字段变化映射为 view contract：

```ts
watch(source, ["posX", "posY"], "position", ({ eid, node }) => {
  node.setPosition(Component.posX[eid], Component.posY[eid]);
});
```

ProjectionRuntime 私有维护 snapshot、row bits 和 eid/node 映射。业务不维护 dirty bit 或 full-sync 标志。

ShrewProjection 同时 watch `ShrewComponent` 与 `AnimationComponent`，所以动作状态和动画 progress 会通过同一个 ShrewNode contract 连续更新。

## Effect

Effect 处理瞬时事实：

```ts
const HitRewardEffect = defineEffect<HitRewardPayload>("hitReward");
effects.emit(HitRewardEffect, payload);
```

Feature 注册 handler，主循环帧末 flush。不要为 reward/miss 创建持久 component。

## Feature

Feature 是业务组装：

```ts
defineFeature({
  name: "foo",
  entities: [FooEntity],
  projections: [FooProjection],
  systems: [defineSystem("feature", "foo.update", fooSystem)],
  setup({ entities, views, effects }) {},
});
```

CoreGameplayFeature 明确创建 9 个 Hole 和 9 个 Shrew，并写入一一对应关系。这种 topology 不应藏在通用 helper 中。

## 点击与回包

```text
touch
  -> KickInputController
  -> hitDetectionSystem
  -> NetworkAdapter.sendKick

response
  -> KickResponseFlow
  -> hitResponseSystem
  -> Player/Hammer component
  -> HitRewardEffect
```

## 新增 Monster 类业务

1. 定义 component。
2. 定义 many EntityDefinition。
3. 在初始化阶段创建池。
4. system 只修改状态、age、visible。
5. 定义 Projection 和 Node。
6. Feature 声明并 mount 池。

新增同类怪物通常只改 `MonsterType`、`MONSTER_CONFIG`、`MONSTER_SPAWN_RULES` 和资源，不修改 GameScene。

## 新增 HUD/瞬时效果

- Player 等持久数字：Projection。
- 金币飘字、miss、一次性动画：Effect。
- Laya 节点通过 `mountOne` 或 `createView` 创建，统一由 ViewRegistry 销毁。

## 排查顺序

规则错误：

```text
input/response -> system/helper -> component
```

表现错误：

```text
component -> projection -> contract -> node
```

效果错误：

```text
emit -> definition identity -> flush -> handler -> node
```

## 完成标准

- ECS 无 Laya 依赖。
- Feature 不承载规则分支。
- 新业务不修改全局 registry。
- 无业务 dirty bit/full-sync。
- 生命周期测试与浏览器 destroy/re-entry 验证通过。
# 当前目录说明

当前代码采用“稳定横向 framework + 业务纵向切片”：

```text
src/framework/{ecs,feature,sync,view}
src/game/features/{shrew,hammer,playerHud,monster,perfHero}
src/game/session
src/app
```

本文后续若出现历史 `src/ecs/gameplay`、`src/features`、`src/sync/projections` 或 `src/view` 路径，以当前目录和 `docs/architecture.md` 为准。
