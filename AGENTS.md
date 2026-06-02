# AGENTS.md

本文件是 Codex/Agent 进入项目后的必读入口，只放硬规则和索引。知识性说明按任务读取 `docs/` 或 `.codex/skills/`。

## 项目定位

- 项目名：`laya-ecs-kickshrew`
- 类型：LayaAir3 + TypeScript + bitecs 打地鼠原型。
- 当前运行主线在 `src/`；`src1/` 只是历史 Lua/Cocos 参考实现。
- 核心目标：用 ECS 承载权威状态和规则，用 dirty binding 差量同步到 Laya 节点。
- 项目同时服务代码实现、架构教学和迁移经验沉淀。

## 每次优先阅读

1. `AGENTS.md`
2. 按任务选择文档：
   - 架构边界和运行流：`docs/architecture.md`
   - ECS、dirty、binding：`docs/ecs-binding.md`
   - Laya 生命周期、资源、坐标：`docs/laya-rules.md`
   - 协议同步和 protobuf 网络边界：`docs/protocol.md`
   - 测试、调试、提交：`docs/test-guide.md`
   - 完整新人教程：`docs/LayaAir3-Project-Onboarding.md`
3. 如果是代码结构、调用链、bug 或“怎么工作”类问题，优先用 codegraph 获取上下文，再读具体文件。

## 核心运行流

```text
Main.ts
  -> GameScene.init()
  -> createGameWorld/createSingletonEntities/createHoleEntities/createShrewEntity
  -> 创建 Laya 节点并通过 ViewRegistry 注册
  -> 注册 SyncView bindings
  -> 创建 GameLoopPipeline/KickInputAdapter
  -> Laya.timer.frameLoop
  -> GameScene.update(delta) -> GameLoopPipeline.update(delta)
```

每帧系统顺序：

```text
animationTimerSystem
shrewStateSystem
sceneCycleSystem
hammerSystem
network.update
dirtyMarkSystem
syncView.sync
```

点击流程：

```text
Laya stage MOUSE_DOWN
  -> GameScene.onTouch(x, y)
  -> KickInputAdapter.handleTouch(x, y)
  -> hitDetectionSystem(world, xRatio, yRatio)
  -> comboSystem
  -> NetworkAdapter.sendKick
  -> KickSocket protobuf encode/send
  -> MockServer protobuf decode/encode（本地 mock）
  -> hitResponseSystem
```

## 强制架构边界

- `src/ecs/**`：游戏规则和权威状态。默认不直接使用 `Laya.*`。
- `src/binding/**`：从 ECS 读取 dirty 数据，调用 view node 接口。
- `src/view/**`：Laya 表现层和运行时装配，可以使用 `Laya.*`。
- `src/network/**`：协议、请求匹配、mock 网络。socket 回包不得直接操作 view。
- `src/config/**`：静态配置和调参入口。
- `src/resource/**`：资源路径、plist/atlas 转换工具。

依赖方向保持：

```text
input/network/resource callback
  -> command/event adapter
  -> ECS systems / domain helpers
  -> DirtyComponent
  -> binding projection
  -> Laya view nodes
```

## 常见改动入口

- 改状态机：`src/ecs/systems/ShrewStateSystem.ts`、`src/ecs/ShrewLifecycle.ts`、`src/tests/ecs/ShrewStateSystem.test.ts`
- 改命中规则：`src/ecs/systems/HitDetectionSystem.ts`、`src/view/KickInputAdapter.ts`、`src/tests/ecs/HitDetectionSystem.test.ts`
- 改 dirty 同步：`src/binding/DirtyFlags.ts`、`src/ecs/systems/DirtyMarkSystem.ts`、`src/binding/*ViewBinding.ts`
- 改 Laya 表现：`src/view/*Node.ts`、`src/config/ViewLayoutConfig.ts`、`docs/laya-rules.md`
- 改网络：`src/network/KickSocket.ts`、`src/network/NetworkAdapter.ts`、`src/ecs/systems/HitResponseSystem.ts`
- 改协议：`api/proto/kick.proto`、`src/network/KickProtoCodec.ts`、`src/network/ProtocolTypes.ts`、`src/tests/network/*`
- 改测试/调试流程：`docs/test-guide.md`

## 工作流规则

- 默认按 TDD：理解现有行为 -> 跑相关测试/确认基线 -> 最小改动 -> 跑相关测试 -> 必要时跑更大范围测试 -> 提交。
- 文档或配置无可执行测试时，不强行补无意义测试；提交信息写明无对应自动化测试。
- 有效改动默认提交 git commit。不要使用 `git reset --hard` 或 `git checkout -- <file>` 丢弃用户改动。
- 工作区可能有用户改动；改文件前看 `git status --short`，只处理本任务相关文件。
- 查文件优先用 `rg`/`rg --files`。默认不读 `node_modules/`。
- 修改运行时、画面、资源、输入、生命周期、网络或调试链路后，优先跑相关测试；需要浏览器验证时使用 `npm run debug:ready`。

## 项目级 Skills

如果本地 Codex/superpowers 支持项目级 skill，按任务读取：

- `.codex/skills/ecs-binding/SKILL.md`：改 ECS 字段、dirty、binding、view 同步。
- `.codex/skills/laya-runtime/SKILL.md`：改 Laya 节点、资源、timer/tween、生命周期。
- `.codex/skills/test-workflow/SKILL.md`：补测试、跑测试、调试构建和提交。
- `.codex/skills/hole-position-tuning/SKILL.md`：调 9 个洞位中心点、地鼠 Stand/Up 对齐、cover 边框调试页。

这些 skill 只定义工作流；背景知识看 `docs/`。
