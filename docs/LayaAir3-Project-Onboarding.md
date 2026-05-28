# LayaAir3 开发者 1 小时项目入门教程

本教程面向已经熟悉 LayaAir3、TypeScript、场景节点和资源加载的开发者。目标是：用 1 小时理解这个项目的运行方式、代码边界、核心数据流，以及以后改功能应该从哪里下手。

项目当前是一个打地鼠游戏原型，核心组合是：

- LayaAir3：负责舞台、节点、纹理、音效、输入和渲染。
- bitecs：负责游戏状态数据、实体、组件和系统。
- dirty binding：负责把 ECS 数据变化同步到 Laya 节点。
- Mock 网络层：模拟击打请求、回包、seqId 匹配和超时。
- `src1/`：历史 Lua/Cocos 实现参考，当前运行主线在 `src/`。

## 0. 先知道本项目是什么

项目名在 `package.json` 中是 `laya-ecs-kickshrew`，描述是 `Kick Shrew game with bitECS + Dirty Binding + Laya rendering`。

你可以把它理解成一次迁移/重构实验：

```text
旧 Cocos/Lua 打地鼠逻辑和资源经验
        |
        v
TypeScript ECS 领域逻辑
        |
        v
Dirty Binding 差量同步
        |
        v
LayaAir3 节点渲染
```

重要目录：

```text
src/
  Main.ts                 Laya 脚本入口
  ecs/                    bitecs 世界、组件、系统
  binding/                ECS 数据到 Laya 视图节点的 dirty binding
  view/                   Laya 节点封装
  network/                击打协议、socket 封装、本地 MockServer
  resource/               atlas/plist 转换与资源路径映射
  config/                 地图、洞位、锤子、地鼠资源配置
  tests/                  vitest 单元测试

src1/
  ...                     老 Lua/Cocos 参考实现

assets/
  ...                     Laya 工程资源、场景、声音

bin/
  ...                     可在浏览器里跑的 Laya 输出/调试 html
```

## 1. 60 分钟阅读路线

如果你只有 1 小时，按这个顺序读。

### 第 0-10 分钟：启动入口

先读 `src/Main.ts`。

关键点：

- `Main extends Laya.Script`，说明这是挂在 Laya 场景里的脚本入口。
- `onStart()` 创建 `GameScene`，调用 `init()` 和 `start()`。
- `Laya.timer.frameLoop(1, this, ...)` 每帧调用 `GameScene.update(delta)`。
- `Laya.stage.on(Laya.Event.MOUSE_DOWN, ...)` 把点击转给 `GameScene.onTouch(stage.mouseX, stage.mouseY)`。
- `Laya.Stat.show(0, 0)` 打开性能面板。

所以项目主循环是：

```text
Laya Script onStart
  -> new GameScene()
  -> GameScene.init()
  -> Laya.timer.frameLoop(...)
  -> GameScene.update(delta)
```

点击流程入口是：

```text
Laya stage MOUSE_DOWN
  -> Main._onTouch()
  -> GameScene.onTouch(x, y)
```

### 第 10-20 分钟：GameScene 是总装配器

再读 `src/view/GameScene.ts`。

`GameScene` 不是纯视图类，它是当前项目的运行时装配器。它负责：

- 创建 ECS world。
- 创建单例实体：锤子、连击、场景、玩家、网络。
- 创建 9 个洞位实体和 9 个地鼠实体。
- 创建 Laya 节点：背景层、洞位、地鼠、锤子、HUD、连击、击中特效。
- 注册 view binding。
- 接入 `NetworkAdapter`。
- 每帧按顺序执行 systems，再执行 `SyncView.sync()`。

`GameScene.update(deltaSec)` 的顺序很关键：

```text
animationTimerSystem(world, deltaSec)
shrewStateSystem(world)
sceneCycleSystem(world)
hammerSystem(world)
network.update()
dirtyMarkSystem(world)
syncView.sync(world)
```

这表示：系统先改 ECS 数据，dirty 系统再标记变更，最后 binding 把变更同步到 Laya 节点。

点击时 `GameScene.onTouch(x, y)` 做这些事：

```text
设计坐标 x/y -> xRatio/yRatio
hitDetectionSystem(world, xRatio, yRatio)
锤子跟随并播放击打动画
如果击中：
  播放音效
  comboSystem(world, hitHoleIndex)
  network.sendKick(...)
否则：
  播放未击中音效
```

### 第 20-30 分钟：bitecs 数据模型

读 `src/ecs/components/index.ts`、`src/ecs/types.ts`、`src/ecs/world.ts`。

这个项目把游戏状态放在 bitecs 组件里。常见 Laya 项目会把状态挂在节点对象上，这里不是。这里节点只是表现层，权威状态在 ECS。

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

重要枚举在 `src/ecs/types.ts`：

- `ShrewType`：红、蓝、黄、绿。
- `ShrewAction`：`None -> Wait -> Up -> Stand -> Down -> Refresh -> None`，以及 `Dizzy/Delay`。
- `MapType`：草地、船、太空。
- `HammerType`：木、石、铜、银、金、神、雷神锤。
- `AnimType`：Idle、Up、Stand、Down、Dizzy 等。

`src/ecs/world.ts` 是实体工厂：

- `createGameWorld()` 创建 world。
- `createShrewEntity(world, shrewType, mapType)` 创建地鼠实体。
- `createHoleEntities(world, mapType)` 创建 9 个洞位实体。
- `createSingletonEntities(world)` 创建锤子、连击、场景、玩家、网络单例实体。

读懂这里后，你就知道“数据在哪里”。

### 第 30-40 分钟：系统如何改变游戏状态

重点读 `src/ecs/systems/`。

#### AnimationTimerSystem

`AnimationTimerSystem.ts` 只推进时间：

- `AnimationComponent.progress += delta / duration`
- `SceneComponent.sceneTimer += delta`

它不直接操作 Laya 动画。它只是更新数据。

#### ShrewStateSystem

`ShrewStateSystem.ts` 是地鼠状态机。

主循环：

```text
None
  -> Wait       随机等待 1-8 秒
  -> Up         出洞动画
  -> Stand      可点击，停留 2 秒
  -> Down       入洞动画
  -> Refresh    重置 hp/帽子/状态
  -> None
```

被击中特殊路径：

```text
Stand/可点击
  -> HitDetectionSystem 设置 Dizzy
  -> Delay
  -> Down
  -> Refresh
  -> None
```

注意：当前 `ShrewStateSystem` 内部用固定 `FRAME_DELTA = 1 / 60` 递减 `animTimer`，而 `AnimationTimerSystem` 用真实 `deltaSec` 推进动画进度。以后如果要做低帧率适配，应该优先统一这个时间来源。

#### HitDetectionSystem

`HitDetectionSystem.ts` 是点击判定。

逻辑：

- 检查 `HammerComponent.hitTable`，不可击打则直接返回 miss。
- 按洞位比例坐标寻找最近洞位。
- 只命中 `ShrewComponent.isClickable === 1` 的地鼠。
- 命中后扣 hp、关点击、设 `Dizzy`，并把 `hitTable` 置 0 防连点。

输入坐标是比例：

```text
touchXRatio = stage.mouseX / 960
touchYRatio = stage.mouseY / 640
```

洞位坐标来自 `src/config/HolePositions.ts`。

#### ComboSystem

`ComboSystem.ts` 负责连击目标选择。

它根据被击中的洞位，在 3x3 网格中找相邻洞位，最多取 3 个可点击地鼠作为连击目标。洞位对外协议用 1-9，所以写回 `targetHole0/1/2` 时会 `+1`。

#### SceneCycleSystem

`SceneCycleSystem.ts` 负责地图循环。

顺序来自 `src/config/SceneConfig.ts`：

```text
Meadow -> Ship -> Space -> Meadow
```

切图时会：

- 更新 `SceneComponent.currentMap`。
- 重置 `sceneTimer`。
- 设置 `transitioning = 1`。
- 给场景、地鼠、洞位设置 `forceFullSync = 1`。
- 更新所有洞位坐标和 zOrder。

#### HammerSystem

`HammerSystem.ts` 负责锤子类型、雷神锤触发、动画完成后的恢复。

当玩家怒气 `PlayerComponent.angry >= 1000` 时，会切到 `HammerType.Thunder`。

#### HitResponseSystem

`HitResponseSystem.ts` 处理服务器回包，更新玩家数据、锤子和连击数据。

真实服务端接入时，这个系统附近会变得重要：服务端回包应该被转换成这个系统能消费的结构，而不是让 Laya 节点直接读 socket 数据。

#### DirtyMarkSystem

`DirtyMarkSystem.ts` 按 world 保存上一帧快照，比较当前帧组件字段，把差异写入 `DirtyComponent` 的各类 bitmask：

- `shrewDirty` / `animDirty`：地鼠状态和动画进度。
- `holeDirty`：洞位坐标、绑定地鼠、zIndex。
- `hammerDirty`：锤子类型、雷神锤状态、是否可击打。
- `comboDirty`：连击次数、comboID、目标洞位。
- `sceneDirty`：当前地图、场景计时、切换状态。
- `playerDirty`：金币、怒气、体力/体力上限、等级。
- `hitDirty`：击中特效的地鼠索引、奖励、是否命中。

第一次看到某个实体时会把对应组件标成全脏，后续帧只标记变化字段。`forceFullSync` 独立于这些 bit，通常用于首次同步或场景切换时要求 binding 全量刷新。

### 第 40-50 分钟：dirty binding 怎么把 ECS 显示出来

读 `src/binding/SyncView.ts` 和各个 `*ViewBinding.ts`。

核心思想：

```text
ECS Component 数据变化
  -> DirtyComponent 记录 dirty bits
  -> SyncView 遍历所有 DirtyComponent 实体
  -> 调用对应 binding
  -> binding 读取组件数据
  -> 调用 Laya Node 接口
  -> 清除 dirty bits
```

`SyncView.sync(world)` 会遍历所有带 `DirtyComponent` 的实体。每个实体可能触发这些 binding：

```text
shrewViewBinding   ShrewComponent + AnimationComponent -> ShrewNode
shrewAnimationViewBinding
                   AnimationComponent.progress -> ShrewNode 位移
holeViewBinding    HoleComponent -> HoleNode
hammerViewBinding  HammerComponent -> HammerNode
comboViewBinding   ComboComponent -> ComboNode
sceneViewBinding   SceneComponent -> SceneLayer
playerViewBinding  PlayerComponent -> PlayerHUD
hitViewBinding     HitComponent -> HitEffectNode
```

每个 binding 都有注册函数，例如：

```ts
registerShrewNode(shrewEid, shrewNode);
registerHoleNode(holeEid, holeNode);
registerPlayerHUD(playerEid, playerHUD);
```

这些注册发生在 `GameScene.init()`。也就是说，ECS 实体 eid 和 Laya 节点对象之间的关系不是由 Laya 节点自己找的，而是由 `GameScene` 装配时建立的。

地鼠出洞/入洞有两条 dirty 链路：`ShrewComponent.actionState` 变化时由 `shrewViewBinding` 切换动作，`AnimationComponent.progress` 在 0.31 秒动画期间变化时由 `shrewAnimationViewBinding` 持续推进 `ShrewNode.setAnimation()`。如果只注册前者，地鼠会收到 Up/Down 起始状态，但后续 progress 不再同步，画面看起来就不会上下运动。

这套结构的好处：

- ECS 逻辑可以单元测试，不依赖 Laya。
- Laya 节点只做表现，不保存核心规则。
- 每帧只同步变化字段，避免到处直接改节点。

这套结构的代价：

- 新增字段时，要同时考虑组件、dirty bit、dirty mark、binding、node 方法。
- 忘记标 dirty 时，ECS 数据变了但画面不变。
- 忘记 unregister 时，可能保留旧节点引用。

### 第 50-55 分钟：Laya 视图节点和资源

读 `src/view/` 和 `src/resource/`。

#### 视图节点职责

`src/view/` 里每个类基本对应一个 Laya 表现对象：

```text
SceneLayer          背景 + cover 遮罩层
HoleNode            洞位容器
ShrewNode           复合地鼠精灵，处理 Cocos 坐标到 Laya 坐标转换
HammerNode          锤子光标和击打动画
PlayerHUD           玩家金币/怒气/体力/等级
ComboNode           连击表现
HitEffectNode       金币/宝箱等击中特效
GoldParticleNode    金币粒子
DizzyStarNode       眩晕星星
TreasureBoxNode     宝箱
NodePool            简单节点对象池
```

这些类允许使用 `Laya.*`。如果你在 ECS system 里看到大量 `Laya.*`，那通常说明边界开始混乱。

#### ShrewNode 是迁移重点

`ShrewNode.ts` 里有很多 Cocos 到 Laya 的坐标换算说明。重点记住：

- Cocos 是 Y-up，Laya 是 Y-down。
- 地鼠是多个部件拼出来的，不是一张整图。
- 部分 atlas 帧有 `rotated=true`，Laya AtlasLoader 不自动补偿，所以节点里手动 `rotation = -90`。
- 出洞/入洞通过移动 `_mainLayer.y` 实现。

以后调地鼠表现，先看 `ShrewNode.ts` 的注释和 `SHREW_FRAMES`。

#### SceneLayer 是场景遮罩重点

`SceneLayer.ts` 管背景和 cover 遮罩层。所有场景统一 zOrder 结构：洞位 zOrder 来自 `getHoleZOrder(row)`。

#### 资源路径

资源逻辑名集中在 `src/resource/AtlasConfig.ts`：

```ts
ATLAS_MAP = {
  shrew_red: "kickshrew/kickshrew_role_red",
  scene_grass: "kickshrew/game_view_grass",
  ...
}
```

加载时路径通常是：

```text
resources/${atlasPath}.atlas
```

`getFrameTexture(atlasRes, frameName)` 通过遍历 `atlasRes.frames` 按 url 后缀找 Texture。原因是 Laya 3.x 的 AtlasResource 子帧不一定能通过 `Loader.getRes(frameUrl)` 拿到。

`src/resource/PlistConverter.ts`、`convertAll.ts`、`rebuild-atlases.ts` 是资源转换工具，用来把老 Cocos plist/texture 流程转成 Laya atlas。

### 第 55-60 分钟：网络和测试

读 `src/network/`。

#### KickSocket

`KickSocket.ts` 做请求-回包匹配：

```text
sendKick()
  -> seqId 自增
  -> pendingRequests.set(seqId, ...)
  -> transport.send(JSON.stringify(req))

onMessage(data)
  -> JSON.parse(resp)
  -> pendingRequests.get(resp.seqId)
  -> resolve promise
  -> delete pending

checkTimeout()
  -> 超过 3 秒移除 pending
```

这个类和 Laya 无关，所以可以单测。

#### NetworkAdapter

`NetworkAdapter.ts` 是当前运行层桥接：

- 默认创建 `MockServer`。
- `sendKick()` 通过 `KickSocket` 发请求。
- Mock transport 里直接调用 `MockServer.handleKick(req)`。
- 用 `setTimeout(..., 50)` 模拟网络延迟。

以后接真实 socket 时，优先替换 `ISocketTransport`，尽量保留 `KickSocket` 的 seqId/pending 机制。

#### MockServer

`MockServer.ts` 模拟服务端奖励、怒气、体力和回包。

它不是权威业务实现，只是本地开发能跑起来。

#### 测试

测试配置：

```text
vitest.config.ts -> include: src/tests/**/*.test.ts
```

运行：

```bash
npm test
```

现有测试覆盖：

- ECS 组件和系统。
- 地鼠状态机。
- 击中检测和回包处理。
- dirty mark。
- network seqId/乱序/超时。
- plist 转 atlas。

这是项目很有价值的部分：核心规则在 `src/ecs` 和 `src/network`，所以可以脱离 Laya 运行时测试。

## 2. 一张总流程图

```text
Main.ts
  |
  v
GameScene.init()
  |
  +-- createGameWorld()
  +-- createSingletonEntities()
  +-- createHoleEntities()
  +-- createShrewEntity()
  +-- new SceneLayer/HoleNode/ShrewNode/HammerNode/PlayerHUD/...
  +-- registerXxxNode(eid, node)
  +-- syncView.registerXxxBinding(...)
  +-- network.onResponse(resp => hitResponseSystem(world, resp))
  +-- forceFullSync all entities
  +-- syncView.sync(world)

每帧:
GameScene.update(delta)
  |
  +-- animationTimerSystem
  +-- shrewStateSystem
  +-- sceneCycleSystem
  +-- hammerSystem
  +-- network.update
  +-- dirtyMarkSystem
  +-- syncView.sync

点击:
GameScene.onTouch(x, y)
  |
  +-- hitDetectionSystem
  +-- HammerNode.followTouch/playHitAnimation
  +-- comboSystem
  +-- NetworkAdapter.sendKick
      |
      +-- KickSocket.sendKick
      +-- MockServer.handleKick
      +-- KickSocket.onMessage
      +-- hitResponseSystem
```

## 3. 以后改功能应该怎么找入口

### 改地鼠生命周期

优先看：

- `src/ecs/systems/ShrewStateSystem.ts`
- `src/ecs/types.ts`
- `src/binding/ShrewViewBinding.ts`
- `src/view/ShrewNode.ts`
- `src/tests/ecs/ShrewStateSystem.test.ts`

例如要新增“眩晕更久”，先改 ECS 状态机，再补测试，最后看表现层是否需要新增动画。

### 改点击命中规则

优先看：

- `src/ecs/systems/HitDetectionSystem.ts`
- `src/config/HolePositions.ts`
- `src/ecs/components/index.ts`
- `src/tests/ecs/HitDetectionSystem.test.ts`

如果只是命中半径，改 `HIT_RADIUS_RATIO`。如果要多目标命中，注意协议 `numOfShrew` 和 `shrews` 数组。

### 改地图/洞位位置

优先看：

- `src/config/HolePositions.ts`
- `src/config/SceneConfig.ts`
- `src/ecs/systems/SceneCycleSystem.ts`
- `src/view/SceneLayer.ts`
- `src/binding/SceneViewBinding.ts`
- `src/binding/HoleViewBinding.ts`

修改洞位位置时注意 cover 遮罩的 zOrder 关系。

### 改锤子和怒气

优先看：

- `src/ecs/systems/HammerSystem.ts`
- `src/config/HammerConfig.ts`
- `src/view/HammerNode.ts`
- `src/binding/HammerViewBinding.ts`
- `src/ecs/systems/HitResponseSystem.ts`

`PlayerComponent.angry >= 1000` 会触发雷神锤。

### 接真实服务器

优先看：

- `src/network/ProtocolTypes.ts`
- `src/network/KickSocket.ts`
- `src/network/NetworkAdapter.ts`
- `src/ecs/systems/HitResponseSystem.ts`
- `src/view/GameScene.ts`

建议保留 `KickSocket` 的请求匹配机制。真实网络只需要实现 `ISocketTransport.send(data)`，并在收到服务端消息时调用 `KickSocket.onMessage(data)`。

### 新增一个 ECS 字段并显示到 Laya

按这个清单走：

1. 在 `src/ecs/components/index.ts` 的对应 component 加字段。
2. 在 `src/ecs/world.ts` 初始化字段。
3. 在 system 中修改字段。
4. 在 `src/binding/DirtyFlags.ts` 增加 bit。
5. 在 dirty mark 系统或修改字段的 system 中设置 dirty。
6. 在对应 `*ViewBinding.ts` 读取字段并调用 node 方法。
7. 在 `src/view/*Node.ts` 实现表现。
8. 补 `src/tests/ecs/*.test.ts`。

这是本项目最常见的扩展路径。

## 4. 当前架构边界

建议把代码按这几层理解：

```text
Laya 入口层
  Main.ts

运行时装配层
  view/GameScene.ts

纯游戏状态/规则层
  ecs/components
  ecs/systems
  ecs/types

表现同步层
  binding/SyncView.ts
  binding/*ViewBinding.ts

Laya 表现层
  view/*Node.ts

网络协议层
  network/ProtocolTypes.ts
  network/KickSocket.ts
  network/NetworkAdapter.ts
  network/MockServer.ts

资源工具层
  resource/AtlasConfig.ts
  resource/PlistConverter.ts
  resource/convertAll.ts
  resource/rebuild-atlases.ts

配置层
  config/*.ts
```

依赖方向应该尽量保持：

```text
ecs/systems -> ecs/components/config/network types
binding -> ecs/components + view interfaces
view -> Laya + resource/config
GameScene -> everything for assembly
```

不要让 ECS system 直接操作 Laya 节点。不要让 Laya 节点直接改权威游戏规则。

## 5. LayaAir3 开发者需要特别注意的差异

### 不是“节点即状态”

传统 Laya 项目常见写法是节点里保存大量状态，例如 `this.hp`、`this.clickable`、`this.mapType`。本项目权威状态在 ECS component 数组里。

视图节点可以缓存当前显示状态，但不应该成为规则判断来源。

### 坐标大量使用比例

洞位配置用 `xRatios/yRatios`，点击也转成比例。这样能适配设计分辨率，但改动时要注意 `DESIGN_WIDTH = 960`、`DESIGN_HEIGHT = 640`。

### dirty binding 是“拉数据”

binding 不是事件推送模型。它每帧遍历 dirty 实体，然后从 component 里读数据更新节点。

### Q: ECS 数据变了但画面没变，应该从哪里查？

A: 按 `Component -> Dirty -> Binding -> View` 顺序排查，不要先去 Laya 节点里猜状态。

- 代码入口：`src/ecs/systems/DirtyMarkSystem.ts`、`src/binding/SyncView.ts`、对应 `src/binding/*ViewBinding.ts`。
- 数据流：system 修改 component，`dirtyMarkSystem` 对比快照写 `DirtyComponent.xxxDirty`，`SyncView.sync()` 调 binding，binding 读取 component 更新 view node。
- 常见坑：字段写进了 component 但 `DirtyFlags` 没有 bit；dirty mark 没比较这个字段；binding 没处理这个 bit；节点没有注册或已销毁但注册表还留着旧引用。
- 验证方式：先跑 `npx vitest run src/tests/ecs/DirtyMarkSystem.test.ts`，再在相关 system 后打印 component 和 dirty bit。

### Q: 地鼠 Up/Down 状态有了，为什么 0.31 秒内没有真正上下移动？

A: `Up/Down` 的动作状态只负责切换阶段，真正位移来自 `AnimationComponent.progress`。`DirtyMarkSystem` 会把 progress 变化写进 `DirtyComponent.animDirty`，`GameScene` 必须注册 `shrewAnimationViewBinding`，让 `SyncView` 在 anim dirty 时继续调用 `ShrewNode.setAnimation(actionState, animType, progress)`。

- 代码入口：`src/ecs/systems/AnimationTimerSystem.ts`、`src/ecs/systems/DirtyMarkSystem.ts`、`src/binding/ShrewViewBinding.ts`、`src/view/GameScene.ts`。
- 数据流：`AnimationComponent.progress -> DirtyComponent.animDirty -> shrewAnimationViewBinding -> ShrewNode.setAnimation -> mainLayer.y`。
- 常见坑：只处理 `BIT_SHREW_ACTION` 会同步动作开始，但不会同步动作中间帧；`animDirty` 有值但没有注册 anim binding 时，`SyncView` 会清掉 dirty，画面仍不动。
- 验证方式：`npm test -- --run src/tests/binding/ShrewViewBinding.test.ts`。

### Q: 地鼠状态是不是太多，能不能精简？

A: 可以精简，但要先区分“权威阶段”和“瞬时实现细节”。当前真正影响规则和同步的是 `Wait/Up/Stand/Down/Dizzy`；`Refresh` 是场景切换和一轮结束时的重置入口，`Delay` 是被击中后短暂停留。未使用的 `Max/Sleep` 已从 `ShrewAction` 清理，`Refresh` 的重置逻辑已收敛到 `resetShrewForNextCycle()`；如果要继续删除 `Refresh` 或 `Delay`，需要同时调整 `SceneCycleSystem`、`ShrewStateSystem`、`ShrewNode` 和相关测试。

### Laya 资源加载是异步的

`ShrewNode.setSpriteFrame()`、`SceneLayer.switchScene()` 都会异步 `Laya.loader.load(...)`。节点销毁/切场景时，要防止异步回调回来操作空节点。当前部分代码已经有 `if (!this._mainLayer) return` 这类保护。

### 老 Cocos 资源迁移仍在代码里留下痕迹

你会看到：

- Cocos Y-up 到 Laya Y-down 的转换。
- plist 的 rotated/trimmed 帧处理。
- `src1/` 的 Lua 命名和资源命名。

这些不是杂音，是迁移线索。

## 6. 当前值得留意的技术债

这些不是阻塞理解项目的问题，但后续开发要知道。

- `GameScene.stop()` 只停 `_running`，还没有完整清理 Laya timer、stage event、binding 注册表、节点和音效。
- `ShrewStateSystem` 用固定 1/60 递减部分 timer，和真实 delta 不完全统一。
- `HitComponent` 已有 binding，但当前击中奖励更多通过回包返回，是否要落到 `HitComponent` 需要后续统一。
- `NetworkComponent` 当前存在但使用较少，网络连接/pending 状态还没有完全 ECS 化。
- `AssetLoader` 已有批量预加载类，但 `GameScene` 中很多节点仍按需加载 atlas。

## 7. 推荐调试方式

### 先跑测试

```bash
npm test
```

如果测试过了，说明纯 ECS、网络、资源转换的核心逻辑基本可用。

当前项目快照中，`npm test` 可以正常启动 Vitest，最近一次检查结果是 117 个测试全部通过。新人排查失败时先判断这是“测试期望落后于当前配置”，还是“代码行为被改坏”；资源和坐标迁移相关测试尤其要对齐 Laya 运行时事实。

### 再开 Laya 运行时看画面

入口 HTML 在 `bin/` 下，例如：

```text
bin/index.html
bin/run.html
bin/run2.html
...
```

具体使用哪个取决于当前 Laya 导出配置。打开后看：

- FPS/DrawCall 面板是否出现。
- 背景是否正常加载。
- 地鼠是否从洞里出现。
- 点击是否有锤子动画和音效。
- 金币/怒气/HUD 是否变化。
- 100 秒后是否切场景。

### 调数据优先 console

因为 ECS 数据在 typed array 上，可以在 system 附近临时打印：

```ts
console.log("shrew", eid, ShrewComponent.actionState[eid], ShrewComponent.isClickable[eid]);
```

不要先去 Laya 节点里猜状态，先看 ECS 数据是否正确。

## 8. 新人上手任务建议

适合第一个任务：

- 改 `HIT_RADIUS_RATIO` 并补命中测试。
- 新增一个地鼠等待时间配置。
- 调整某个地图洞位坐标。
- 给 `GameScene.stop()` 增加事件、节点、音效、binding 注册表和 network callback 清理。
- 给 `GameScene.stop()` 增加事件和节点清理。

不建议第一个任务：

- 重写资源加载。
- 重写 ShrewNode 部件拼装。
- 改场景遮罩结构。
- 一次性接真实服务器并改协议。

## 9. 一句话总结

这个项目的核心不是“Laya 节点里写游戏逻辑”，而是：

```text
bitecs 存状态和跑规则
dirty binding 做差量同步
LayaAir3 只负责把当前状态表现出来
```

读代码时始终沿着这条线走：入口 `Main`，装配 `GameScene`，状态 `components/world`，规则 `systems`，同步 `binding`，表现 `view`，网络 `network`，资源 `resource/config`。
