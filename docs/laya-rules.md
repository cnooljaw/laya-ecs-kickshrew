# LayaAir 约定

本文说明 Laya 运行时、视图节点、资源、坐标和生命周期规则。改 `src/game/features/*/*Node.ts`、`src/app/**` 或 `src/framework/view/**` 时优先读这里。

## 基本边界

- 具体 Node 保留在 `src/game/features/<name>`，可以使用 `Laya.*`。
- Component、Entity、System、Projection 默认不直接使用 `Laya.*`。
- `src/framework/view` 只封装容易随 Laya 版本变化的 runtime lookup、loader、Spine 构造和生命周期清理。
- 不封装普通 `x/y/visible/zOrder/scale/addChild`，避免制造影子 UI 框架。
- view node 只表现当前 ECS 状态，不保存权威规则状态。
- socket 回包不能直接操作 view，必须先更新 ECS。
- 异步资源加载、timer、tween、event 都要有 owner 和 teardown。

## 视图节点职责

```text
SceneLayer          背景 + cover 遮罩层
HoleNode            洞位容器
ShrewNode           复合地鼠精灵，处理 Cocos 坐标到 Laya 坐标转换
HammerNode          锤子光标和击打动画
PlayerHUD           玩家金币/怒气/体力/等级
HitEffectNode       金币/宝箱等击中特效
GoldParticleNode    金币粒子
DizzyStarNode       眩晕星星
TreasureBoxNode     宝箱
NodePool            简单节点对象池
PerfHeroNode        压测英雄 Spine 槽位，使用共享 Spine 资源池
MonsterNode         独立怪物的 Laya Spine 节点，例如 Rhino
```

如果 view node 里出现命中合法性、奖励、状态机、协议字段解析等逻辑，通常说明边界穿透了。

## 生命周期检查清单

创建或 review Laya 视图时检查：

- 事件在哪里注册，在哪里注销。
- `Laya.timer` 用哪个 caller/method 注册，销毁时是否用同一对清理。
- `Laya.Tween` 是否可能在节点销毁后继续跑。
- 异步 `Laya.loader.load()` 回调回来时节点是否还存在。
- `removeChildren()` 是否只是移出显示树；需要释放子节点时显式传 `destroy=true`。
- 是否把已销毁节点留在闭包、静态 map、registry 或数组里。
- 是否需要 `ViewRegistry` 统一 unregister/destroy。
- 场景切换或 `destroy()` 是否能重复调用而不报错。
- 对象池复用节点是否先隐藏、重置本地 transform，再播放和显示。
- 当前动画仍可见时，新的重生/切换请求是否会导致容器坐标瞬移。

当前 owner：

- `Main`：frameLoop、stage event、脚本生命周期。
- `GameScene`：world、network callback、runtime adapter、ViewRegistry、FeatureRegistry 调用。
- `Feature`：创建本模块的 view node，通过 `mountOne/mountPool/createView/own` 声明关系和所有权。
- `ProjectionRuntime`：初始化时编译 query、字段快照和实例级 eid/node registry。
- `ViewRegistry`：统一反注册和销毁 mount/own 的对象。
- view node：自己创建的 Laya 子节点、局部 timer/tween/异步回调保护。

## Spine 和对象池

Spine/Skeleton 压测见 `docs/performance-tuning.md`。运行时规则：

- `.sk` templet 可以缓存，但 Skeleton 实例也应按资源池化，避免每轮 `destroy + buildArmature`。
- 共享池由对应 Feature 创建并通过 `own()` 交给运行时持有，单个 view node 只持有当前 active 实例。
- pooled Skeleton attach 到容器前先隐藏，并重置本地 `x/y/scale/rotation/alpha`。
- 父容器应在设置新坐标和调用 `play()` 期间保持隐藏，播放状态重置完成后再显示。
- 如果旧动画仍可见，下一次重生请求不要立刻改父容器坐标；应 pending 到 STOPPED/退场隐藏后再应用。
- STOPPED 回调属于 view node 生命周期，销毁时必须 `offAll` 或等价清理。

MonsterFeature 第一版同屏默认只有 1 个 Rhino，`MonsterNode` 负责 `.sk` 异步加载、播放和显隐保护。怪物 10 秒后消失由 ECS 的 `MonsterComponent.visible=0` 驱动，view node 不自己开 timer。`.sk` 加载失败不会永久缓存失败 Promise，后续同 URL 生成会重试；异步回调必须校验节点未销毁且请求仍是最新。

## 配置和调参入口

- 跨业务规则：`src/config/GameTuning.ts`
- Shrew：`src/game/features/shrew/{ShrewRules,ShrewViewConfig,HolePositions,SceneConfig}.ts`
- Hammer：`src/game/features/hammer/{HammerConfig,HammerViewConfig}.ts`
- Player HUD：`src/game/features/playerHud/PlayerHudViewConfig.ts`
- Monster：`src/game/features/monster/{MonsterRules,MonsterViewConfig}.ts`
- PerfHero：`src/game/features/perfHero/{PerfHeroRules,PerfHeroViewConfig}.ts`
- atlas 逻辑名：`src/resource/AtlasConfig.ts`

不要在 view 或 system 里重新散落 `960/640`、`0.31`、命中半径、zOrder、HUD 坐标等数字。先看是否已有配置。

## 坐标转换

设计分辨率在 `GameTuning.DESIGN_RESOLUTION`：

```text
width = 960
height = 640
```

点击输入：

```text
touchXRatio = stage.mouseX / DESIGN_RESOLUTION.width
touchYRatio = stage.mouseY / DESIGN_RESOLUTION.height
```

洞位配置用比例坐标，`HoleNode` 再投影到设计分辨率。

迁移风险：

- Cocos 是 Y-up，Laya 是 Y-down。
- 老 Cocos 背景宽度和 Laya 设计宽度不同，洞位 X 可能带历史转换。
- cover 遮罩和洞位 zOrder 互相依赖，不能只看单个节点。

## ShrewNode 迁移重点

`ShrewNode.ts` 是 Cocos 到 Laya 迁移最复杂的节点：

- 地鼠由身体、脸、耳、手、眼等部件拼装。
- 部件坐标从 Cocos Y-up 转成 Laya Y-down。
- 部分 atlas 帧有 `rotated=true`，Laya AtlasLoader 不自动补偿，需要手动 `rotation = -90`。
- 出洞/入洞通过移动 `_mainLayer.y` 实现。
- `HolePositions` 表示地鼠出洞视觉锚点；地鼠 `Stand` 时 body 中心对齐该点，`Up/Down` 在该点与本地裁剪窗口下方之间插值。
- `hiddenOffsetRatio` 在 `ShrewViewConfig`。
- 重建地鼠部件时必须销毁旧子节点，不能只 `removeChildren()`。否则 `Sprite2DCount` 可能稳定，但旧部件相关的贴图/GPU buffer 仍会在长时间运行中累积。

调地鼠表现前先读 `ShrewNode.ts` 注释和 `SHREW_FRAMES`，不要直接改状态机来修视觉问题。

## SceneLayer 和遮罩

`SceneLayer.ts` 管：

- 背景图。
- cover 前景遮罩。
- 场景切换遮罩。

cover 需要盖住地鼠行，zOrder 与洞位行相关。修改地图、洞位、cover 资源时同时看：

- `src/game/features/shrew/HolePositions.ts`
- `src/game/features/shrew/SceneConfig.ts`
- `src/game/features/shrew/SceneLayer.ts`
- `src/game/features/shrew/SceneCycleSystem.ts`

## Laya 升级检查

升级 LayaAir 版本时先运行 `src/tests/framework/view`。优先检查：

- `getLaya()` 的全局运行时获取。
- `loadResource/loadSpineTemplate` 的参数和 Promise 行为。
- `createSkeleton` 的 `buildArmature` / `Laya.Skeleton` 分支。
- timer、tween、event、children 和 destroy 清理语义。

业务 Node 的普通布局属性不应因升级而进入 framework wrapper。

## 资源路径

资源逻辑名集中在 `src/resource/AtlasConfig.ts`：

```ts
ATLAS_MAP = {
  shrew_red: "kickshrew/kickshrew_role_red",
  scene_grass: "kickshrew/game_view_grass",
}
```

加载时通常使用：

```text
resources/${atlasPath}.atlas
```

`getFrameTexture(atlasRes, frameName)` 会遍历 `atlasRes.frames` 按 url 后缀找 Texture。原因是 Laya 3.x 的 AtlasResource 子帧不一定能通过 `Loader.getRes(frameUrl)` 拿到。

资源转换工具：

- `src/resource/PlistConverter.ts`
- `src/resource/convertAll.ts`
- `src/resource/rebuild-atlases.ts`

修改 plist、rotated、trimmed 相关逻辑时必须看现有资源测试和实际 atlas 格式。

## LayaIDE .meta 策略

`.meta` 文件主要服务 LayaIDE 资源库索引和 uuid 映射。当前项目不依赖 LayaIDE 做日常开发，运行时代码按路径加载资源，LayaIDE 只作为打包入口时：

- 已经被 git 跟踪的 `.meta` 保持不动，避免影响历史资源、场景或打包兼容性。
- 新生成但未跟踪的 `.meta` 视为 IDE 噪声，可以清理。
- `.gitignore` 使用 `*.meta` 阻止后续新 `.meta` 反复污染工作区。
- 如果以后新增必须由 LayaIDE 管理的场景、预制体或资源配置，再用 `git add -f path/to/file.meta` 单独纳入版本控制。

## 表现代码测试策略

通常不单测：

- 简单节点定位。
- 纯视觉 tween。
- 资源路径字符串拼接之外的 Laya 运行时表现。

应该测试：

- 坐标转换纯函数。
- 资源转换器。
- 输入 adapter。
- registry 清理。
- 影响规则或同步链路的 view adapter。

表现改动完成后，优先：

```bash
npm run debug:ready
```

然后在 VS Code 使用 `tsc Debug` 或打开 `http://localhost:8080/debug-tsc.html` 做基础冒烟。
