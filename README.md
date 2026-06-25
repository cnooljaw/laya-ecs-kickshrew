# laya-ecs-kickshrew

LayaAir3 + TypeScript + bitecs 的打地鼠游戏原型。ECS 承载权威状态和规则，编译式 ProjectionRuntime 差量同步 Laya 节点，typed EffectRuntime 处理瞬时表现。

## 快速开始

安装依赖：

```bash
npm install
```

运行测试：

```bash
npm test
```

类型检查：

```bash
npx tsc --noEmit
```

准备 VS Code/浏览器调试：

```bash
npm run debug:ready
```

调试页：

```text
http://localhost:8080/debug-tsc.html
http://<局域网IP>:8080/debug-tsc.html
```

`npm run debug:ready` 会将调试服务绑定到 `0.0.0.0:8080`，本机和局域网设备使用同一个端口。每次改完运行它，会重新构建 debug 输出并确认 8080 服务可用。

VS Code 推荐使用 `tsc Debug` 配置，sourceMap 可以直接命中 TS 源码断点。

## 项目结构

```text
src/
  app/                    Main、Bootstrap、GameScene、GameLoopPipeline
  framework/ecs/          EntityDefinition / EntityRuntime
  framework/feature/      Feature Manifest、Registry、mount 原语
  framework/sync/         Projection / Effect 运行时
  framework/view/         ViewRegistry 与 Laya 版本兼容层
  game/features/          shrew、hammer、playerHud、monster、perfHero
  game/session/           跨 Feature 输入、回包和 Thunder 编排
  game/GameFeatures.ts    显式 Feature 注册
  ecs/world.ts            bitecs world 创建
  network/                KickSocket、NetworkAdapter、MockServer
  resource/               atlas/plist 转换与资源路径映射
  config/                 地图、洞位、规则和表现配置
  tests/                  Vitest 测试

src1/                     历史 Lua/Cocos 参考实现
assets/                   Laya 工程资源
bin/                      浏览器运行和调试入口
docs/                     项目知识库
.codex/skills/            项目级 Codex 工作流
```

## 文档入口

- `AGENTS.md`：给 Codex/Agent 的极简必读规则和索引。
- `docs/architecture.md`：架构边界、运行流、模块职责和生命周期 owner。
- `docs/ecs-binding.md`：bitecs、EntityDefinition、ProjectionRuntime 和 EffectRuntime。
- `docs/laya-rules.md`：Laya 生命周期、资源加载、坐标转换、atlas 迁移注意事项。
- `docs/test-guide.md`：TDD、测试命令、debug 构建、提交规范。
- `docs/LayaAir3-Project-Onboarding.md`：给开发者的完整一小时入门教程。

## 核心数据流

```text
Input / Network / Resource callback
  -> adapter / system
  -> ECS component
  -> ProjectionRuntime
  -> Laya view node
```

权威游戏状态在各 `src/game/features/*` 切片的 Component 中。Laya 节点只负责表现，不作为规则判断来源。

## 当前重点

- `Main`/脚本层 teardown：清理 frameLoop、stage event 和背景音乐。
- 网络回包 command/event 化，继续降低 `GameScene` 对具体 system 的感知。
- ECS/Projection 调试工具：实体快照、字段 diff 和 runtime 生命周期。
- 真实 socket 接入点整理，保留 `KickSocket` 的 seqId/pending 机制。
