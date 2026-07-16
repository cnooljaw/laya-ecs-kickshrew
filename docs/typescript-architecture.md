# TypeScript 架构思路

本文帮助维护者从代码形状理解项目的架构选择。它不定义新的框架规则；模块职责、依赖方向和运行时顺序以 `docs/architecture.md` 为准，ECS API 以 `docs/ecs-binding.md` 为准。

## 先建立正确预期

项目采用的是函数优先、数据驱动和显式组合的 TypeScript 风格，不是“所有代码都必须是纯函数”的教条：

- System 是普通函数，但会写入权威 Component。
- `defineFeature`、`defineSystem`、`defineProjection` 和 `defineEffect` 用对象描述注册材料；真正的 setup 和运行仍是明确的命令式代码。
- Laya Node 使用 class，因为它要持有引擎节点、timer、tween 和异步资源生命周期。这是表现层细节，不是权威玩法状态。
- `world`、runtime 和 queue 是每个场景创建、场景退出销毁的运行时对象，不是跨场景全局单例。

目标不是少写 class，而是让“规则、数据、装配、引擎细节”各自有一个明确 owner。

## 1. 函数优先：规则是可直接调用和测试的函数

进入帧循环的规则以 `(world, deltaSec) => void` 表达：

```ts
export type GameSystem = (world: any, deltaSec: number) => void;

defineSystem("state", "shrew.state", shrewStateSystem);
defineSystem("derived", "session.hammerThunder", activateHammerThunderIfCharged);
```

对应代码在 `src/framework/feature/FeatureManifest.ts`、`src/game/features/shrew/ShrewFeature.ts` 和 `src/game/session/SessionSystems.ts`。

这样一个规则不需要继承 `BaseSystem`、保存 `this.world`，也不需要从 Laya Scene 取对象。测试可以直接创建 bitecs world 后调用：

```ts
shrewStateSystem(world, 1 / 60);
expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Stand);
```

函数优先不等于没有状态。状态应该放在 Component、每场景 queue 或由明确 owner 持有的 runtime 中；System 本身不要悄悄保留上一场景的 entity 或 Node。

## 2. 数据驱动：Definition 和 Manifest 描述“贡献什么”

一个 Feature 用 manifest 声明自己加入 world 的内容，而不是由中心 `GameManager` 知道每个业务细节：

```ts
export const ShrewFeature = defineFeature({
  name: "shrew",
  entities: [ShrewEntity],
  projections: [ShrewProjection],
  systems: [
    defineSystem("state", "shrew.animationTimer", shrewAnimationTimerSystem),
    defineSystem("state", "shrew.state", shrewStateSystem),
    defineSystem("derived", "shrew.boardSync", shrewBoardSyncSystem),
  ],
  setup: setupCoreGameplay,
});
```

`GameFeatures.ts` 是显式组合根：它列出哪些 Foundation 和 Feature 构成本局游戏。`GameFeatureRegistry` 再收集 Entity、Projection 和 System，生成每场景的 runtime。

同样的描述式对象还包括：

| Definition | 描述的事实 | 运行时 owner |
| --- | --- | --- |
| `EntityDefinition` | 实体组件组合、基数和初始值 | `EntityRuntime` |
| `FeatureManifest` | 一个纵向切片贡献的实体、系统、投影与 setup | `GameFeatureRegistry` |
| `ProjectionDefinition` | 哪些 Component 字段变化时调用哪个视图契约 | `ProjectionRuntime` |
| `EffectDefinition` | 一类瞬时事实的 payload 类型与 channel 身份 | `EffectRuntime` |

这使新增 Monster、Hero 或 UI Feature 的常见改动集中在自己的目录，最后只在组合根增加一条显式注册，而不是修改多个继承层。

## 3. 组合优于继承：Feature 是纵向切片，Laya class 是窄适配器

业务 Feature 的目录通常同时拥有 Component、Entity、规则、Projection、Node、配置和公开契约：

```text
src/game/features/monster/
  MonsterComponents.ts
  MonsterEntities.ts
  MonsterSystems.ts
  MonsterProjection.ts
  IMonsterNode.ts
  MonsterNode.ts
  MonsterRules.ts
  MonsterViewConfig.ts
  assembly.ts / index.ts
```

Monster 不继承 `BaseFeature`，Shrew 也不继承 `BaseCharacter`。二者按需要组合 Component，并复用 board 的公开 `BoardPositionComponent`、`BoardTopology` 和 `BoardOps`。

Laya Node 仍然使用 class：

```ts
export class PlayerHUD implements IPlayerHUD {
  private _moneyText: any = null;

  setMoney(value: number): void {
    this._moneyText.text = `金币: ${value}`;
  }
}
```

这份私有引用是渲染资源，不是游戏规则。`PlayerComponent.money` 才是权威状态；`PlayerProjection` 决定何时调用 `setMoney`。不要让 Node 反查 ECS，也不要让 System 直接访问 Node。

## 4. 显式依赖注入：依赖通过参数、capability 或闭包进入

项目避免让规则到处读取全局单例。常见注入方式有三种。

### 参数注入

一次性 helper 直接接收它需要的数据：

```ts
applyKickResponse(world, response, traceLogger);
```

调用者能从签名看出它会操作哪个 world、使用哪个回包和日志实现。

### setup capability

Feature setup 使用 `provide/use` 传递场景级能力。Board 创建固定拓扑后提供 `BoardTopologyCapability`；Monster 在 setup 时取得它，并把它捕获在本场景 system 闭包中：

```ts
setupSystems: ctx => {
  const board = ctx.use(BoardTopologyCapability);
  return [
    defineSystem("gameplay", "monster.spawn", (world, deltaSec) => {
      monsterSpawnSystem(world, board, currentMilestone, deltaSec);
    }),
  ];
}
```

`board` 随本场景 `GameFeatureRuntime` 一起销毁，不会变成跨场景服务定位器。

### 闭包注入

网络 ingress 是最小的例子：

```ts
export function createGameIngressSystem(queue, effects): GameSystem {
  return world => queue.drain(world, effects);
}
```

`GameScene` 创建 per-scene `GameIngressQueue` 和 `EffectRuntime`，再把它们传入工厂函数。System 运行时只知道已经注入的依赖；它不需要 import `GameScene` 或访问全局 `window`。

依赖注入的边界是“传入最小能力”，不是把一个万能 `GameContext` 传给所有人。

## 5. 声明式注册与确定的帧顺序

`defineSystem(phase, name, run)` 同时给出系统的阶段、稳定名称和行为。系统顺序由 `GAME_SYSTEM_PHASES` 明确规定：

```text
network.update
  -> ingress   已到达的网络事实按 FIFO 写入 ECS
  -> state     时间轴、状态机、冷却
  -> gameplay  命中、生成、占用
  -> derived   从本帧玩法结果推导状态
  -> ProjectionRuntime.mark/sync
  -> EffectRuntime.flush
```

例如服务端 kick 回包进入 `GameIngressQueue`；ingress 阶段写入 Player/Hammer Component；同帧 `derived` 计算是否激活雷神锤；随后 Projection 更新 HUD 和锤子，Effect 在帧末触发奖励表现。完整例子见 `docs/architecture.md` 的“网络与输入”。

这比 System 相互调用更容易推理：要知道某规则读到什么数据，只需看它所在 phase 之前有哪些阶段，而不需要沿着调用栈猜测。

## 6. 持久状态与瞬时事实分流

不要把所有界面变化都当成一种“事件”。项目区分两条链路：

```text
持久状态
  Component -> Projection -> I*Node -> Laya Node

瞬时事实
  EffectRuntime.emit -> frame-end flush -> Feature handler -> Laya Node
```

金币、怒气、等级、锤子类型属于持久状态。`PlayerProjection` 用 `watch` 声明字段变化后如何更新 HUD：

```ts
watch(source, ["money"], "player money", ({ eid, node }) => {
  node.setMoney(PlayerComponent.money[eid]);
});
```

奖励飘字、miss 音效属于只消费一次的瞬时事实：

```ts
export const HitRewardEffect = defineEffect<HitRewardPayload>("hitReward");

effects.on(HitRewardEffect, payload => {
  hitEffectNode.showReward(payload.shrewIndex, payload.reward);
});
```

这样重连或首次 full sync 会恢复金币数字，却不会错误重播旧飘字。

## 7. 写新代码时如何应用

新增一个玩法规则时，先按下面的问题做归位：

1. 它是持续状态机、一次命令，还是瞬时表现？
2. 它的权威数据属于哪个 Feature 的 Component？
3. 它应位于哪个 phase，依赖哪些已完成的事实？
4. 它需要的是参数、setup capability，还是 per-scene closure？
5. 它是 Projection 字段，还是 typed Effect？
6. 它是否把 Laya、socket、dirty bit 或另一个 Feature 的内部文件带进了规则层？如果是，先修边界。

推荐阅读顺序：

1. `src/game/GameFeatures.ts`：组合根。
2. `src/app/GameScene.ts` 和 `src/app/GameLoopPipeline.ts`：场景装配与帧顺序。
3. `src/game/session/GameIngressQueue.ts`：外部网络事实如何进入 world。
4. `src/game/features/shrew/`：固定拓扑、状态机、Projection 的完整切片。
5. `src/game/features/monster/`：对象池、setup capability 和跨 Feature 公开契约。

性能优化仍以实际 profiling 为前提。当前 `ProjectionRuntime` 使用字段快照比较；业务代码不应自行维护 dirty queue 或 registry key。
