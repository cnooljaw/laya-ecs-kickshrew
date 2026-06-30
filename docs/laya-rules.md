# LayaAir 规则

本文记录本项目的 Laya 运行时规则。通用 Laya 生命周期判断使用全局 skill `layaair-developer`。

## 边界

- `src/game/features/<name>/*Node.ts` 可以使用 `Laya.*`。
- Component、Entity、System、Projection 默认不使用 `Laya.*`。
- `src/framework/view` 只封装容易随 LayaAir 版本变化的窄接口：runtime lookup、loader、Spine 构造、children destroy、ViewRegistry。
- 不封装普通 `x/y/visible/zOrder/scale/addChild`，避免制造影子 UI 框架。
- socket 回包不能直接操作 view，必须先更新 ECS 或 emit typed effect。
- async loader、timer、tween、event 必须有 owner 和 teardown。

## 生命周期 owner

- `Main`：frameLoop、stage event、脚本生命周期。
- `GameScene`：world、network callback、runtime adapter、ViewRegistry、FeatureRegistry 调用。
- `Feature`：创建本模块 view node，通过 `mountOne/mountPool/createView/own` 声明关系和所有权。
- `ProjectionRuntime`：字段快照、eid/node registry 和 dirty arrays。
- `ViewRegistry`：统一反注册和销毁 mount/own 的对象。
- view node：自己的 children、timer、tween 和 async callback guard。

## View 节点

```text
shrew/SceneLayer          背景、cover、场景切换遮罩
shrew/HoleNode            洞位容器
shrew/ShrewNode           地鼠复合精灵和 Cocos -> Laya 坐标转换
hammer/HammerNode         锤子光标和击打动画
playerHud/PlayerHUD      金币、怒气、体力、等级
playerHud/HitEffectNode  一次性击中特效
perfHero/PerfHeroNode    压测英雄 Spine 槽位
monster/MonsterNode      怪物 Spine 节点
```

如果 Node 里出现命中合法性、奖励计算、状态机或协议字段解析，通常说明边界穿透。

## 生命周期检查

- 事件在哪里注册，就在同一 owner 的 teardown 中注销。
- `Laya.timer` 清理必须使用同一 caller/method。
- `Laya.Tween` 不能在节点 destroy 后继续持有节点。
- `Laya.loader.load()` 回调需要 destroyed/stale guard。
- `removeChildren()` 默认只移出显示树；需要释放子节点时用 `removeChildren(0, -1, true)` 或显式 destroy。
- 对象池复用前隐藏、重置 transform，再播放和显示。
- 场景切换和重复 `destroy()` 必须幂等。

## 配置位置

- 跨业务规则：`src/config/GameTuning.ts`
- Shrew：`src/game/features/shrew/{ShrewRules,ShrewViewConfig,HolePositions,SceneConfig}.ts`
- Hammer：`src/game/features/hammer/{HammerConfig,HammerViewConfig}.ts`
- Player HUD：`src/game/features/playerHud/PlayerHUDViewConfig.ts`
- Monster：`src/game/features/monster/{MonsterRules,MonsterViewConfig}.ts`
- PerfHero：`src/game/features/perfHero/{PerfHeroRules,PerfHeroViewConfig,PerfRuntimeConfig}.ts`
- atlas 逻辑名：`src/resource/AtlasConfig.ts`

不要在 view 或 system 里散落 `960/640`、命中半径、zOrder、HUD 坐标等数字。

## 坐标与 Shrew

设计分辨率在 `GameTuning.DESIGN_RESOLUTION`。洞位配置使用比例坐标，`HoleNode` 投影到设计分辨率。

迁移风险：

- Cocos 是 Y-up，Laya 是 Y-down。
- Laya AtlasResource 子帧不一定能通过 `Loader.getRes(frameUrl)` 拿到，本项目用 `getFrameTexture(atlasRes, frameName)` 按 url 后缀查找。
- `rotated=true` 的 atlas 帧需要 `ShrewNode` 手动补偿。
- cover zOrder 与洞位行绑定。改地图时同时看 `HolePositions`、`SceneConfig`、`SceneLayer`、`MapCycleSystem`。

## Laya 升级检查

升级 LayaAir 版本先跑：

```bash
npm test -- --run src/tests/framework/view
npx tsc --noEmit
npm run debug:ready
```

优先检查：

- `getLaya()` 全局运行时获取。
- `loadResource/loadSpineTemplate` 参数和 Promise 行为。
- `createSkeleton` 的 `buildArmature` / `Laya.Skeleton` 分支。
- timer、tween、event、children 和 destroy 清理语义。

普通布局属性不应因为升级而进入 framework wrapper。

## LayaIDE Meta

当前运行时代码按路径加载资源，LayaIDE 只作为打包入口时：

- 已跟踪 `.meta` 保持不动。
- 新生成但未跟踪 `.meta` 视为 IDE 噪声。
- 如新增必须由 LayaIDE 管理的场景或资源配置，再用 `git add -f path/to/file.meta` 单独纳入版本控制。
