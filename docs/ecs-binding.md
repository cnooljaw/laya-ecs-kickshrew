# ECS 与 Dirty Binding

本文说明 bitecs 数据建模、dirty 标记和 binding 投影链路。改 ECS 字段、画面同步、dirty 漏标、地鼠状态机时优先读这里。

## 权威状态

本项目把游戏状态放在 bitecs component 数组中，Laya 节点只是表现层。

核心组件：

```text
ShrewComponent       地鼠类型、血量、状态、帽子、地图、可点击、动画计时、道具
HoleComponent        洞位行列、位置比例、绑定的地鼠 eid、zIndex
HammerComponent      当前锤子、雷神锤状态、是否可击打 hitTable
ComboComponent       连击数、comboID、最多 3 个目标洞位
SceneComponent       当前地图、场景计时、循环间隔、切换状态
PlayerComponent      金币、怒气、体力、等级
AnimationComponent   动画类型、进度、时长
HitComponent         击中结果表现数据
NetworkComponent     网络连接/击打 pending 状态
DirtyComponent       各组件 dirty bitmask + forceFullSync
```

重要枚举：

- `ShrewType`：红、蓝、黄、绿。
- `ShrewAction`：`Wait/Up/Stand/Down/Dizzy`。
- `MapType`：草地、船、太空。
- `HammerType`：木、石、铜、银、金、神、雷神锤。
- `AnimType`：Idle、Up、Stand、Down、Dizzy。

实体工厂：

- `createGameWorld()`
- `createShrewEntity(world, shrewType, mapType)`
- `createHoleEntities(world, mapType)`
- `createSingletonEntities(world)`

## Dirty Binding 数据流

```text
System 修改 Component
  -> DirtyMarkSystem 对比上一帧快照
  -> DirtyComponent.xxxDirty 写 bitmask
  -> SyncView 遍历 DirtyComponent 实体
  -> 调用对应 binding
  -> binding 读取 component
  -> 调用 view node 接口
  -> SyncView 清除 dirty bits
```

`forceFullSync` 独立于 dirty bit，通常用于首次同步或场景切换。

## DirtyFlags

`src/binding/DirtyFlags.ts` 是 DirtyMarkSystem 和 Binding 的共同协议。新增需要显示的字段时，先确认是否已经有合适 bit。

命名保持一一对应：

```text
BIT_SHREW_ACTION -> ShrewComponent.actionState -> shrewViewBinding
BIT_ANIM_PROGRESS -> AnimationComponent.progress -> shrewAnimationViewBinding
BIT_HOLE_POS -> HoleComponent.posXRatio/posYRatio -> holeViewBinding
```

## DirtyAspect

`src/ecs/dirty/aspects/*DirtyAspect.ts` 声明每类实体的 dirty 映射。`DirtyMarkSystem` 只负责遍历这些 aspect，通用比较逻辑在 `src/ecs/dirty/DirtySchemaRunner.ts`。

核心角色：

```text
Entity = 权威数据身份，一个数字 eid
Component = 挂到 eid 上的数据切片
System = 修改/计算 ECS 数据的规则
DirtyComponent = ECS 到 View 的变化信号
ShrewNode = Laya 画面对象，只负责表现
Binding = 把 ECS 数据翻译成 ShrewNode 方法调用
```

DirtyAspect 分四层：

```text
DirtyAspect   某类实体的组件组合，例如 ShrewComponent + AnimationComponent + DirtyComponent
DirtyChannel  写到 DirtyComponent 的哪一列，例如 shrewDirty 或 animDirty
DirtyMark     某个 dirty bit，对应一组 ECS 字段
DirtyField    一个可比较的 component 字段，例如 ShrewComponent.actionState
```

地鼠链路额外有一张表格式规则：`src/binding/rules/ShrewViewRules.ts`。这张表同时服务 dirty 和 binding：

```ts
const SHREW_COMPONENT_RULES = defineShrewViewRules([
  // bit                   label          fields             apply
  row(BIT_SHREW_TYPE,      "地鼠类型",    ["shrewType"],     applySpriteFrame),
  row(BIT_SHREW_HP,        "地鼠生命值",  ["hp"],            noView),
  row(BIT_SHREW_ACTION,    "动作状态",    ["actionState"],   applyAnimation),
  row(BIT_SHREW_MAP,       "地图皮肤",    ["mapType"],       applySpriteFrame),
  row(BIT_SHREW_CLICKABLE, "是否可点击",  ["isClickable"],   applyClickable),
]);
```

这里 `fields` 决定 DirtyMarkSystem 比较哪些 ECS 字段，`apply` 是真正的 view 投影函数。`ShrewDirtyAspect` 从 rules 派生 `DirtyMark`，`ShrewViewBinding` 从同一份 rules 执行 `apply`，不再靠 `"ShrewNode.setXxx"` 这类字符串说明来同步。

记忆顺序：

```text
Component 字段
  -> DirtyFlags bit
  -> DirtyAspect DirtyMark（Shrew 由 ShrewViewRules 派生）
  -> DirtyComponent.xxxDirty
  -> ViewBinding 处理 bit（Shrew 执行 rules.apply）
  -> ViewNode 方法
```

新增可视字段时，先写出这一行再改代码：

```text
Component.field -> BIT_组件_字段 -> DirtyComponent.xxxDirty -> xxxViewBinding -> XxxNode.setXxx(...)
```

示意：

```text
ShrewComponent.actionState
  -> BIT_SHREW_ACTION
  -> DirtyComponent.shrewDirty
  -> shrewViewBinding
  -> ShrewNode.setAnimation(...)
```

`requires` 是给人看的组件组合说明，真正决定 bitecs 遍历范围的仍然是 `defineQuery([...])`。例如：

```text
requires: ["ShrewComponent", "AnimationComponent", "DirtyComponent"]
query: defineQuery([ShrewComponent, AnimationComponent, DirtyComponent])
```

这表示同时拥有这三个 component 的 eid 会被视为地鼠 dirty aspect 的实体。

多字段共用一个表现更新时，把多个 `DirtyField` 放进同一个 `DirtyMark`。例如洞位位置：

```text
BIT_HOLE_POS -> HoleComponent.posXRatio/posYRatio -> holeViewBinding -> HoleNode.setPosition(...)
```

这表示 X 或 Y 任一变化都触发同一个位置更新 bit。

## SyncView 和 Binding

`SyncView.sync(world)` 负责：

1. 遍历所有带 `DirtyComponent` 的实体。
2. 判断各类 dirty bit 和 `forceFullSync`。
3. 调对应 binding。
4. 清除 dirty bit。

主要 binding：

```text
shrewViewBinding             ShrewComponent -> ShrewNode
shrewAnimationViewBinding    AnimationComponent.progress -> ShrewNode 位移
holeViewBinding              HoleComponent -> HoleNode
hammerViewBinding            HammerComponent -> HammerNode
comboViewBinding             ComboComponent -> ComboNode
sceneViewBinding             SceneComponent -> SceneLayer
playerViewBinding            PlayerComponent -> PlayerHUD
hitViewBinding               HitComponent -> HitEffectNode
```

ECS eid 和 Laya node 的映射由 `ViewRegistry` 在装配期建立，不由 view node 自己查 ECS。

## 新增 ECS 字段并显示到 Laya

按这个清单走：

1. `src/ecs/components/index.ts` 增加字段。
2. `src/ecs/world.ts` 初始化字段。
3. 对应 system 或 helper 修改字段。
4. `src/binding/DirtyFlags.ts` 增加 bit。
5. 如果是地鼠表现，优先在 `src/binding/rules/ShrewViewRules.ts` 增加一行 `row(bit, label, fields, apply)`；其他实体仍在对应 `src/ecs/dirty/aspects/*DirtyAspect.ts` 增加字段读取和 dirty bit 映射。
6. 如果是地鼠表现，在 `ShrewViewRules.ts` 增加或复用 `applyXxx` 函数；其他实体仍在对应 `src/binding/*ViewBinding.ts` 读取字段并调用 node 方法。
7. 对应 `src/view/*Node.ts` 实现表现。
8. 补 `src/tests/**/*.test.ts`。

## 排查：ECS 数据变了但画面没变

按顺序查：

```text
Component 是否真的变了
DirtyAspect 是否比较了这个字段
DirtyComponent.xxxDirty 是否有对应 bit
SyncView 是否注册了对应 binding
binding 是否处理了对应 bit
view node 是否注册到正确 eid
view node 方法是否真的更新了 Laya 节点
```

常见坑：

- 字段写进 component，但 `DirtyFlags` 没有 bit。
- 对应 `DirtyAspect` 漏了字段。
- binding 没处理这个 bit。
- `shrewAnimationViewBinding` 没注册，导致 Up/Down 只有状态没有中间位移。
- 节点已销毁但旧引用仍留在注册表。

验证入口：

```bash
npm test -- --run src/tests/ecs/DirtyMarkSystem.test.ts
npm test -- --run src/tests/binding/ShrewViewBinding.test.ts
```

## 地鼠状态机 Q&A

### Q: 为什么状态是 Wait/Up/Stand/Down/Dizzy？

A: 当前状态已经从旧的 `None/Refresh/Delay` 精简过：

- `Wait` 同时承担隐藏等待和下一轮入口。
- `Down` 只表示自然入洞动画。
- `Dizzy` 表示被击中短暂停留，结束后直接进入下一轮 `Wait`。
- `resetShrewForNextCycle()` 是统一重置入口。

自然循环：

```text
Wait -> Up -> Stand -> Down -> resetShrewForNextCycle -> Wait
```

命中循环：

```text
HitDetectionSystem -> startShrewDizzyHold -> Dizzy -> resetShrewForNextCycle -> Wait
```

### Q: 为什么命中后 Dizzy 不进入 Down？

A: `Down` 是自然入洞动画，`Dizzy` 是被击中后的短暂停留和重置。命中后再走 `Down` 会混淆“自然离场”和“被击中离场”，还会让 Down 期间再次被击中的语义复杂化。

### Q: Up/Down 状态有了，为什么画面没有上下移动？

A: `Up/Down` 只切换阶段，真正位移来自 `AnimationComponent.progress`。dirty 链路必须包含：

```text
AnimationComponent.progress
  -> DirtyComponent.animDirty
  -> shrewAnimationViewBinding
  -> ShrewNode.setAnimation(...)
  -> mainLayer.y
```

## ECS 使用风险

- 状态分散：新增字段前先判断是否已有合适 component。
- 样板膨胀：dirty bit、schema、binding、node 方法要命名一致。
- 调试困难：复杂 system 要能通过测试重放。
- 同步遗漏：不要用 `forceFullSync` 掩盖常规 dirty 漏标。
- 生命周期不清：world、view node、timer、stage event、network callback 都要有 owner。
- 过度 ECS 化：纯视觉 hover、一次性粒子、局部 tween 不一定进入 ECS。
