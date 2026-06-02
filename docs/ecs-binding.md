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

## DirtyMarkSystem schema

`src/ecs/systems/DirtyMarkSystem.ts` 使用 `DIRTY_SCHEMAS` 声明：

- 用哪个 query 找实体。
- 用哪个快照仓库。
- 写哪个 `DirtyComponent.xxxDirty`。
- 首次同步的 `allBits`。
- 每个 dirty bit 读取哪些 component 字段。

新增字段时优先改 schema，而不是手写一段新的比较逻辑。

示意：

```text
{
  query: shrewQuery,
  storeKey: "shrew",
  dirtyTarget: "shrewDirty",
  allBits: BIT_SHREW_ALL,
  groups: [
    { bit: BIT_SHREW_ACTION, fields: [actionState reader] }
  ]
}
```

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
5. `DirtyMarkSystem.ts` 的 `DIRTY_SCHEMAS` 增加字段读取和 dirty bit 映射。
6. 对应 `src/binding/*ViewBinding.ts` 读取字段并调用 node 方法。
7. 对应 `src/view/*Node.ts` 实现表现。
8. 补 `src/tests/**/*.test.ts`。

## 排查：ECS 数据变了但画面没变

按顺序查：

```text
Component 是否真的变了
DirtyMarkSystem schema 是否比较了这个字段
DirtyComponent.xxxDirty 是否有对应 bit
SyncView 是否注册了对应 binding
binding 是否处理了对应 bit
view node 是否注册到正确 eid
view node 方法是否真的更新了 Laya 节点
```

常见坑：

- 字段写进 component，但 `DirtyFlags` 没有 bit。
- `DIRTY_SCHEMAS` 漏了字段。
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
