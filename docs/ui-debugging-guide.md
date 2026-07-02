# 界面调试指南

本文帮助维护者用 debug 页面校准洞位、Shrew 站位、Monster 三角落点和 Spine 表现问题。它只记录界面调试工作流；模块边界看 `docs/architecture.md`，Laya 生命周期规则看 `docs/laya-rules.md`。

## 入口选择

先启动 debug 服务：

```bash
npm run debug:ready
```

常用页面：

```text
http://localhost:8080/debug-tsc.html
http://localhost:8080/debug-meadow-shrews-stand.html
http://localhost:8080/debug-ship-shrews-stand.html
http://localhost:8080/debug-space-shrews-stand.html
http://localhost:8080/debug-meadow-shrews-up0.html
http://localhost:8080/debug-meadow-monster-drop.html
http://localhost:8080/debug-ship-monster-drop.html
http://localhost:8080/debug-space-monster-drop.html
```

选择规则：

| 目标 | 优先页面 | 用途 |
| --- | --- | --- |
| 调 Shrew 洞中心 | `debug-*-shrews-stand.html` | 看 Shrew body center 是否对齐红色十字。 |
| 查 Shrew 裁剪和 cover | `debug-meadow-shrews-up0.html` | 看 Up 起点、洞口遮挡和 cover zOrder。 |
| 调 Monster 三角落点 | `debug-*-monster-drop.html` | 看 16 个三洞三角形中心、Drop 起点和落点。 |
| 查 ECS、互斥、刷怪时机 | `debug-tsc.html` | 看真实主循环、Feature 系统顺序、Projection 和输入回包。 |

预览页只验证单个表现问题。主页面才验证 ECS 状态、地图切换、对象池复用、Shrew 与 Monster 互斥。

## Shrew 洞位

`debug-*-shrews-stand.html` 用红色十字标记 `HolePositions` 的洞位中心。标签包含洞编号、row/column 和 Shrew zOrder。

调参顺序：

1. 打开目标地图的 `debug-*-shrews-stand.html`。
2. 只看 `Stand` 状态下 Shrew body 的视觉中心。
3. 修改 `src/game/board/HolePositions.ts` 对应地图的 `xRatios` / `yRatios`。
4. 重新跑 `npm run debug:ready`，刷新页面确认。
5. 再用 `debug-meadow-shrews-up0.html` 检查 Up 起点和 cover 遮挡。

比例换算：

```text
设计分辨率: 960 x 640
0.0010 xRatio ~= 0.96px
0.0010 yRatio ~= 0.64px
```

方向判断：

| 现象 | 调整 |
| --- | --- |
| 红点在 Shrew 视觉中心右侧 | 降低 `xRatio`。 |
| 红点在 Shrew 视觉中心左侧 | 提高 `xRatio`。 |
| 红点在 Shrew 视觉中心下方 | 降低 `yRatio`。 |
| 红点在 Shrew 视觉中心上方 | 提高 `yRatio`。 |

不要用 Up 页调洞中心。Up 页主要检查裁剪、hidden offset 和 cover 层级。

## Cover 和 zOrder

洞位按行使用固定 zOrder：

```text
row0 hole/shrew zOrder = 2, cover zOrder = 3
row1 hole/shrew zOrder = 4, cover zOrder = 5
row2 hole/shrew zOrder = 6, cover zOrder = 7
```

如果 Shrew 该被遮住却露出来，先查：

1. `SceneLayer` 是否加载了正确地图的 cover atlas。
2. cover 的 y、高度和 zOrder 是否符合预览页标记。
3. `HolePositions` 是否把 Shrew 中心放得过高或过低。
4. `ShrewNode` 的裁剪矩形是否仍按当前 atlas 帧计算。

不要通过改 Shrew 的全局 zOrder 解决局部遮挡问题。遮挡问题优先归因到洞位、cover 或裁剪。

## Monster 三角落点

`debug-*-monster-drop.html` 会画出所有可用三角形：

- 红线：三洞中心连线。
- 红点和编号：三角形中心点与 triad index。
- 按钮 `0` 到 `15`：按 `MONSTER_HOLE_TRIADS` 顺序播放 Monster Drop。
- `Replay`：重播当前三角形。
- `Next`：播放下一个三角形。

Monster 落点规则：

```text
triad center x = 三个 hole xRatio 的平均值
triad center y = 三个 hole yRatio 的平均值
Drop 起点 = 屏幕最高处
Drop 时间 = 0.31s
Stay 位置 = 三角形中心加 Monster 视觉框偏移
```

调 Monster 时先在对应地图的 drop 页面确认：

1. 红色三角形是否覆盖预期三个洞。
2. 红点是否是这三个洞视觉中心的几何中心。
3. Monster 最终视觉中心是否落在红点。
4. Drop 是否从屏幕顶部落到红点，而不是从旧位置或洞口附近出现。

如果预览页对、`debug-tsc.html` 不对，优先查 ECS 和投影：

```text
MonsterComponent.holeA/B/C
  -> BoardPositionComponent.xRatio/yRatio
  -> MonsterProjection
  -> MonsterNode.setPosition
```

如果 `debug-tsc.html` 有 Shrew 和 Monster 同洞，先查 `HoleComponent.occupantKind/occupantEid`。Monster 占用三洞后，这三个洞的 resident Shrew 必须进入 blocked 状态。

互斥排查顺序：

1. `monsterSpawnSystem` 是否只从 `canOccupyTriad(board, triad)` 返回可用的三角形里随机选择。
2. `spawnMonster` 是否通过 `tryOccupyTriad(board, triad, ...)` 成功后才写 `MonsterComponent.visible/holeA/holeB/holeC/spawnSeq`。
3. Shrew 候选是否仍要求对应 Hole 的 `occupantKind/eid` 等于当前 Shrew。
4. Monster 消失或 Dizzy 结束后，`releaseTriad` 是否把三洞恢复为 resident。
5. 切图后 `MapCycleSystem` 是否保留 occupant，`monsterBoardSyncSystem` 是否重算 Monster 三角中心。

## Monster 对齐标记

Monster drop 页面有蓝色和灰色调试框：

| 标记 | 含义 | 用途 |
| --- | --- | --- |
| 蓝色十字 `container` | `MonsterNode` 容器坐标。 | 这是业务定位锚点。 |
| 蓝色框 `visualBounds` | 配置中的视觉有效框。 | 用它把 Monster 视觉中心对齐三角中心。 |
| 灰色框 `raw skeleton.getBounds()` | Laya Skeleton 原始 bounds。 | 只用于诊断资源范围，通常不直接作为落点依据。 |

优先用 `MONSTER_VIEW_CONFIG[MonsterType.Rhino].visualBounds` 做偏移。不要为了对齐修改 Skeleton anchor，也不要直接相信 `skeleton.getBounds()`。Spine/DragonBone 资源可能包含隐藏部件、整图、空白或历史附件，raw bounds 会比视觉有效区域大。

## Spine 和资源叠影

遇到“闪”“残影”时先区分三类问题：

| 表现 | 常见原因 | 排查位置 |
| --- | --- | --- |
| 整个角色忽隐忽现 | `visible`、`actionState`、对象池复用或 Projection 顺序。 | `MonsterComponent.visible`、`MonsterNode.setVisible`。 |
| 位置从旧点跳到新点 | `BoardPositionComponent` 未按当前地图重算。 | `monsterBoardSyncSystem`、`BoardOps`。 |
| 局部部件画了两份 | 资源 slot 同时显示整图和拆分部件，或 Skeleton 绘制缓存异常。 | `MonsterNode`、`rhino.png`、`rhino.sk`。 |

这次 Rhino 的叠影原因是资源里同时有完整整图 `zong` 和拆分骨骼部件。运行时必须在每次 `play` 后隐藏 `zong` slot：

```ts
skeleton.showSlotSkinByIndex("zong", -1);
```

注意：`play(..., freshSkin=true)` 会重置 skin/display，所以隐藏 slot 要放在 `play` 后。只在加载完成时隐藏一次不够。

Monster 还显式使用 `aniMode=2` 创建 Laya Skeleton：

```ts
createSkeleton(templet, 2);
```

这避开默认缓存帧 Graphics 的叠帧风险。当前 Monster 数量很少，实时绘制成本可接受；不要把这个选择直接套到所有 Spine 节点。

## 预览页与主页面差异

预览页更适合看单点表现，但它不会覆盖真实主循环里的全部问题。

| 差异 | 预览页 | `debug-tsc.html` |
| --- | --- | --- |
| 地图 | 固定一张地图。 | 每 `SCENE_CYCLE_INTERVAL` 切图。 |
| 生成 | 手动按钮播放。 | 金币跨 100 倍数触发。 |
| 占用 | 直接隐藏 triad 对应 Shrew。 | 通过 `HoleComponent.occupantKind/eid` 互斥。 |
| 位置 | 直接调用 `MonsterNode.setPosition`。 | `BoardPositionComponent` 经 Projection 投影。 |
| 复用 | 常见是单节点重复播放。 | 固定实体池和节点池复用。 |

判断顺序：

1. 预览页也错：先查 Node、资源、`HolePositions`、`visualBounds`。
2. 预览页对、主页面错：先查 ECS 数据流、系统顺序、Projection 和对象池复用。
3. 只有切图后错：先查 `MapCycleSystem` 是否改了洞位但保留了 current occupant，再查 active Monster 是否按新地图重算中心。

## 修改后的验证

窄验证：

```bash
npm test -- src/tests/game/features/monster/MonsterNode.test.ts
npm test -- src/tests/game/features/monster/MonsterSystem.test.ts
npm test -- src/tests/game/features/shrew/ShrewBoardSyncSystem.test.ts
npm test -- src/tests/framework/view/LayaSpine.test.ts
```

运行时可见改动：

```bash
npx tsc --noEmit
npm run debug:ready
```

最后打开对应预览页和 `debug-tsc.html`。不要只看预览页就判断主流程已修好。
