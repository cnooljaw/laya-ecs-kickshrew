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

### 从 `GameSystem` 到 `SystemDefinition`

`GameSystem` 是函数类型，不是 class：

```ts
export type GameSystem = (world: any, deltaSec: number) => void;
```

以下两个声明都可以提供符合该类型的行为：

```ts
function movementSystem(world: any, deltaSec: number): void {
  // 读写 Component
}

const system: GameSystem = movementSystem;
system(world, deltaSec); // 等同于 movementSystem(world, deltaSec)
```

赋值或作为参数传递的是函数引用，不会复制函数实现。Scheduler 最终调用的仍是原来的函数。

有些 System 只需要 `world`，例如网络 ingress：

```ts
export function createGameIngressSystem(
  queue: GameIngressQueue,
  effects: Pick<EffectRuntime, "emit">,
): GameSystem {
  return world => queue.drain(world, effects);
}
```

这是工厂函数（Factory Function），不是 System 本身。调用工厂时，`queue` 与 `effects` 被闭包捕获；后续 Pipeline 即使统一调用 `run(world, deltaSec)`，这个函数也可以忽略不需要的 `deltaSec`，只执行 `queue.drain(world, effects)`。因此 Pipeline 不需要认识网络 queue 或 EffectRuntime。

`defineSystem` 再为函数补上调度元数据：

```ts
export interface SystemDefinition {
  readonly phase: GameSystemPhase;
  readonly name: string;
  readonly run: GameSystem;
}

export function defineSystem(
  phase: GameSystemPhase,
  name: string,
  run: GameSystem,
): SystemDefinition {
  return { phase, name, run };
}
```

所以：

```ts
defineSystem("state", "shrew.state", shrewStateSystem)
```

得到的是普通对象：

```ts
{
  phase: "state",
  name: "shrew.state",
  run: shrewStateSystem,
}
```

`system.run(world, deltaSec)` 只是通过对象字段调用原函数，不表示 `system` 是一个 class 实例。

调用链为：

```text
shrewStateSystem
  -> GameSystem
  -> defineSystem
  -> SystemDefinition
  -> GameFeatureRegistry 收集为 RegisteredGameSystem
  -> GameFeatureRuntime.systemsByPhase
  -> GameLoopPipeline
  -> system.run(world, deltaSec)
```

这里有三种不同职责：

| 内容 | 负责回答的问题 | 当前代码 |
| --- | --- | --- |
| `GameSystem` | 规则“怎么做” | 普通函数 |
| `SystemDefinition` / `RegisteredGameSystem` | 规则“叫什么、在哪个 phase” | 普通元数据对象 |
| `GameFeatureRegistry` / `GameLoopPipeline` | 规则“何时被收集、何时执行” | 组合与调度机制 |

当前 Pipeline 的调度逻辑保持简单：

```ts
for (const phase of GAME_SYSTEM_PHASES) {
  for (const system of featureRuntime.systemsByPhase(phase)) {
    system.run(world, deltaSec);
  }
}
```

`GAME_SYSTEM_PHASES` 决定 phase 顺序；同一 phase 内的顺序由显式 Feature 注册和 setup-time system 收集顺序决定。这是当前的确定性契约，测试应保护它。

这两层循环本身不是已知瓶颈：phase 数量固定为四个，内层只遍历已装配的 System。`ClientDiagnostics` 默认不把 `FrameDiagnostics` 注入 `GameScene`，因此 `GameLoopPipeline` 会走没有逐步骤计时的正常路径。只有在 QA 或开发环境临时打开单一诊断开关后，才额外记录 network、每个 System、Projection 和 Effect 的耗时，用真实数据决定是否需要改变调度或投影模型。

`SystemDefinition` 确实为未来诊断、开关或 profiling 留出了扩展位置，但不要误解为“只加字段就自动生效”。例如新增 `priority`，还必须由 `GameFeatureRegistry` 明确排序；新增 `enabled`，还必须由 Pipeline 或 Registry 决定何时过滤。只有已有的 `phase`、`name`、`run` 才是当前真实支持的调度协议。

因此，更准确的总结是：ECS 用函数承载规则，用对象承载元数据，用 Pipeline 承载时序；同时仍由 Entity 和 Component 承载权威游戏数据与关系。它不是只管理函数，也不是只管理对象。

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

### 从 `FeatureManifest` 到每场景 `GameFeatureRuntime`

把大功能的组装理解为下面这条链路是正确的：

```text
FeatureManifest（各切片声明贡献）
  -> GameFeatureRegistry（校验、收集、按场景装配）
  -> GameFeatureRuntime（已按 phase 排好的本场景系统表）
  -> GameLoopPipeline（每帧执行系统表）
```

不过四者的职责需要分清。`FeatureManifest` 是开发期的**装配材料**；`GameFeatureRuntime` 是一次场景进入后得到的**执行计划**，它既不持有 `world`，也不自己执行 System。真正的帧调度者仍是 `GameLoopPipeline`。

一个 Manifest 可以选择性贡献 Entity、Projection、静态 System 和 setup 钩子；并不是每个 Feature 必须同时拥有它们。例如 HUD Feature 可以只有投影和视图装配，Board 是被多个业务切片复用的 Foundation，而非一个业务角色 Feature。

```ts
export const MonsterFeature = defineFeature({
  name: "monster",
  entities: [MonsterEntity, MonsterTriggerEntity],
  projections: [MonsterProjection],
  setup: ({ entities, mountPool }) => {
    const eids = createMonsterPool(entities, poolInputs);
    mountPool({ eids, projection: MonsterProjection, create: () => new MonsterNode() });
  },
  setupSystems: ctx => [/* 使用 ctx.use(...) 创建动态 System */],
});
```

`GameFeatures.ts` 是显式的组合根：它用固定数组决定 Foundation、Feature 的加入顺序，并调用 `createGameFeatureRegistry(...)`。这里没有目录扫描、反射注册或“自动发现所有 Feature”；顺序和游戏组成都是可读、可测试的代码。

Registry 在创建时先校验静态名称重复，并预收集 `entityTypes()` 与 `projections()`；`GameScene` 使用这两份材料创建 `EntityRuntime`、`ProjectionRuntime` 等每场景 runtime。随后它以 `FeatureSetupContext` 调用 `setupAll()`，实际顺序为：

```text
每个 Feature.setup(ctx)                 // 按组合根数组顺序
  -> options.sessionSetup(ctx)           // 跨 Feature 的 session 组装
  -> 每个 Feature 的静态 systems         // 同样保持声明顺序
  -> 每个 Feature.setupSystems(ctx)      // 可读取 setup 已提供的 capability
  -> options.systems                     // Registry 配置的 session System
  -> runtimeSystems                      // GameScene 本次传入的运行时 System
  -> 按 ingress/state/gameplay/derived 分组
  -> GameFeatureRuntime.systemsByPhase()
```

同一 phase 内不额外排序，保留上述收集顺序；不同 phase 的先后由 `GAME_SYSTEM_PHASES` 固定。这就是当前 System 顺序的真实来源，而不只是“Feature 的某个数组顺序”。动态返回的 System 与静态 System 一样都会在 setup 完成后校验名称唯一性。

`setup` 也不是“整个程序只执行一次”。它在每次 `GameScene` 创建并调用 `setupAll()` 时执行一次；退出场景后，world、runtime、view 和 queue 一起销毁，再进入新场景会重新装配。适合在这里创建固定槽位、挂载本场景 Node、注册 typed Effect handler、声明 lifecycle owner、通过 `provide` 暴露场景能力。不要把它理解为通用的全局 EventBus 或 Command 注册入口：当前项目的真实 API 是 `ctx.effects.on(...)`、`ctx.provide(...)` / `ctx.use(...)` 等窄能力。

动态 `setupSystems(ctx)` 的价值是让规则在创建时取得本场景依赖并通过闭包保存。例如实际 Monster 装配中：

```text
BoardFoundation.setup
  -> provide(BoardTopologyCapability)
sessionSetup
  -> provide(MonsterSpawnMilestoneCapability)
MonsterFeature.setupSystems
  -> use 两个 capability，创建 monster.boardSync / monster.spawn 等 System
```

这说明它不是“运行时随时注册系统”：注册仍发生在场景 setup 阶段，只是 System 的函数可以根据本场景拓扑、配置或服务生成。反过来，网络 ingress 的 `GameIngressQueue` 和 `EffectRuntime` 属于 app 层每场景对象，因此当前代码由 `GameScene` 构造 `createGameIngressSystem(...)`，再作为 `runtimeSystems` 传给 Registry；它不属于任何业务 Feature 的 `setupSystems`。

把 Registry 称为“组合器”或“小型装配注册表”比“DI Container / ApplicationContext”更准确。它确实借助 `FeatureSetupContext` 提供有限的 typed capability，但不会自动解析任意对象图，也不拥有 `world`、网络连接或 Laya 生命周期。依赖仍必须由组合根显式创建并以参数、capability 或闭包交给需要它的地方。

完整的场景生命周期可以这样阅读：

```text
GameFeatures.ts（声明本局组成）
  -> GameFeatureRegistry（静态校验、Entity / Projection 收集）
  -> GameScene 创建 world、各 runtime、FeatureSetupContext、network queue
  -> registry.setupAll(...) 生成 GameFeatureRuntime
  -> GameLoopPipeline 每帧从 systemsByPhase 读取并执行
  -> ProjectionRuntime 同步持久状态到 view；EffectRuntime flush 瞬时事实
  -> 场景退出：清理 queue、runtime、world 与 view；下一场重新生成
```

因此，一个 Feature 更接近“可组合的游戏纵向切片”，Registry 更接近“将切片编译成场景执行计划的组合根协作者”，而不是传统继承体系中的大型模块对象。

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
