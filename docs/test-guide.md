# 测试、调试与提交

本文说明如何选择测试命令、启动 debug 服务和提交改动。

## 默认 TDD

1. 读现有行为和边界。
2. 跑窄测试确认基线。
3. 先写失败契约。
4. 最小实现。
5. 跑窄测试、类型检查和必要的全量测试。
6. 运行时可见改动执行 `npm run debug:ready` 和浏览器验证。
7. 提交本次改动文件。

## 常用命令

```bash
npm test
npx tsc --noEmit
```

Entity 与 Projection：

```bash
npm test -- --run src/tests/ecs/EntityRuntime.test.ts
npm test -- --run src/tests/sync/ProjectionDefinition.test.ts src/tests/sync/ProjectionRuntime.test.ts
npm test -- --run src/tests/sync/CoreViewSync.test.ts src/tests/sync/FeatureViewSync.test.ts src/tests/sync/HudViewSync.test.ts
```

Effect：

```bash
npm test -- --run src/tests/effects
```

核心规则：

```bash
npm test -- --run src/tests/game/features/shrew/ShrewStateSystem.test.ts
npm test -- --run src/tests/game/features/shrew/ShrewAnimationTimerSystem.test.ts src/tests/game/board/MapCycleSystem.test.ts
npm test -- --run src/tests/game/session/KickHitDetection.test.ts src/tests/game/session/KickResponseHandler.test.ts
npm test -- --run src/tests/game/features/monster
npm test -- --run src/tests/game/features/perfHero
```

架构边界与生命周期：

```bash
npm test -- --run src/tests/architecture/FrameworkBoundary.test.ts
npm test -- --run src/tests/features src/tests/view/GameScene.test.ts
```

## 覆盖重点

- EntityDefinition 基数、默认值、固定拓扑和对象池。
- network/ingress/state/gameplay/derived/rebuild/projection/effect 顺序。
- 网络 callback 入队、ingress FIFO drain 和 scene destroy 清队列。
- Projection 初次同步、差量比较和 apply 去重。
- typed Effect 的 enqueue、flush、clear。
- Shrew 状态机、命中、Hammer、Player 回包。
- Monster 固定池、tracker 数量和不删除实体策略。
- world 退出时 runtime、node、effect handler 和 snapshot 清理。
- protobuf、seqId、超时与乱序回包。
- Laya 节点池化、async resource stale guard 和 destroy。

## 测试归位

测试目录按“保护哪个边界”命名，不按历史实现放置。

- `src/tests/ecs`：只放框架 ECS 机制，例如 `EntityRuntime`、`GameWorld`。
- `src/tests/sync`、`src/tests/effects`：只放 Projection、Effect runtime 和定义层测试。
- `src/tests/features`：放 FeatureRegistry、运行时装配、生命周期这类框架/业务交界测试。
- `src/tests/game/features/<name>`：放具体业务切片规则，例如 shrew 状态机、地图轮换、monster 池。
- `src/tests/game/session`：放输入、命中检测、回包处理和跨 Feature 编排。
- 移动 Laya 项目里的测试文件时，同步移动已跟踪的 `.meta` 文件；如果新路径被 `.gitignore` 忽略，需要 `git add -f`。

## 调试

```bash
npm run debug:ready
```

页面：

```text
http://localhost:8080/debug-tsc.html
http://localhost:8080/debug-tsc.html?perf=1&heroes=200
http://localhost:8080/debug-meadow-shrews-stand.html
http://localhost:8080/debug-ship-shrews-stand.html
http://localhost:8080/debug-space-shrews-stand.html
http://localhost:8080/debug-meadow-shrews-up0.html
http://localhost:8080/debug-meadow-monster-drop.html
http://localhost:8080/debug-ship-monster-drop.html
http://localhost:8080/debug-space-monster-drop.html
```

`debug:ready` 会编译 TypeScript、修复 ESM 扩展、复制 vendor/资源，并确认 8080 服务可用。
洞位、Monster 三角落点和 Spine 表现调试看 `docs/ui-debugging-guide.md`。

`src/app/ClientDiagnostics.ts` 的唯一 `ENABLE_CLIENT_DIAGNOSTICS` 开关默认关闭。关闭时主调试页不创建 Laya Stat、Heap 或 `ECS frame` 面板，`GameLoopPipeline` 也不记录逐步骤耗时；这是正常客户端路径。需要诊断时临时打开该开关：面板第一行是最近帧、平均帧和最大帧耗时；`schedule` 是实际执行的 `phase:system` 顺序；随后列出最近一帧耗时最高的步骤。先确认 schedule 是否符合预期，再根据耗时决定是否需要优化，不把两层 System 调度循环当作默认瓶颈。

以下改动必须优先做浏览器验证：

- `src/app/GameScene.ts` / `src/app/GameLoopPipeline.ts`
- Feature setup
- Projection 或 Effect 到具体 Laya 节点
- 输入、网络回包、资源、timer、tween、destroy

## 房间权威同步联调

改动 Go 服务端房间、protobuf、Shrew 时间线、地图时间线或客户端网络接入时，先执行：

```bash
cd ../GoServerActorFsm && go test ./...
cd ../LayaEcsDemo && npm test
cd ../LayaEcsDemo && npx tsc --noEmit
cd ../LayaEcsDemo && npm run debug:ready
```

启动服务端后，用三个浏览器页面连接同一个服务端；确认三者进入同一 Running 房间，且 `attack_id`、Shrew 时间线、地图、`map_revision` 与 `next_switch_ms` 一致。再打开第四个页面，确认它进入新的 Filling 房间，显示 Meadow 且没有地鼠。刷新其中一个 Running 页面，确认快照能让它立即追赶当前地图和地鼠状态。

### 控制台报错分流

先按报错源文件判断归属。`content.js`、`polyfill.js`、`useCache` 或 “Could not establish connection. Receiving end does not exist.” 通常来自浏览器扩展的内容脚本或消息通道，不代表 Laya 应用异常。使用无扩展的隐身窗口复现，并查看实际报错栈是否落在 `src/**` 或编译后的应用模块。

`src/app/Main.ts` 的启动日志只说明页面已经执行到游戏入口；它不是网络或运行时异常的定位依据。应用问题应继续检查 WebSocket 连接、协议响应、`attack_id` / revision 和 ECS 投影链路。

## 排查路径

画面不同步：

```text
system component value
  -> Projection watched fields
  -> projection mount eid/node
  -> contract method
  -> concrete Node state
```

瞬时效果：

```text
adapter emit
  -> same EffectDefinition identity
  -> GameLoopPipeline.flush
  -> Feature handler
  -> effect node
```

常用日志：

- `hit.blocked`：锤子冷却，不是坐标 miss。
- `hit.miss`：命中检测未找到目标。
- `score.applied`：回包已更新 ECS。
- `binding.dizzyAnimation`：历史日志名，表示 ShrewProjection 已投影 Dizzy 动画。

## 提交

默认提交有效改动。commit 描述尽量用中文。提交前至少确认：

```bash
git diff --check
npm test
npx tsc --noEmit
```

不要提交 `bin/js/debug` 等生成物。
