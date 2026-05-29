# laya-ecs-kickshrew

LayaAir3 + TypeScript + bitecs 的打地鼠游戏原型。项目目标是用 ECS 承载权威状态和规则，用 dirty binding 将 ECS 数据差量同步到 Laya 节点，同时保留可测试、可讲解的客户端架构边界。

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
```

VS Code 推荐使用 `tsc Debug` 配置，sourceMap 可以直接命中 TS 源码断点。

## 项目结构

```text
src/
  Main.ts                 Laya 脚本入口
  ecs/                    bitecs world、components、systems
  binding/                ECS -> Laya 节点 dirty binding
  view/                   Laya 表现层、运行时装配、输入适配
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
- `docs/ecs-binding.md`：bitecs、DirtyFlags、DirtyMarkSystem schema、SyncView 和 binding Q&A。
- `docs/laya-rules.md`：Laya 生命周期、资源加载、坐标转换、atlas 迁移注意事项。
- `docs/test-guide.md`：TDD、测试命令、debug 构建、提交规范。
- `docs/LayaAir3-Project-Onboarding.md`：给开发者的完整一小时入门教程。

## 核心数据流

```text
Input / Network / Resource callback
  -> adapter / system
  -> ECS component
  -> DirtyMarkSystem
  -> SyncView binding
  -> Laya view node
```

权威游戏状态在 `src/ecs/**`。Laya 节点只负责表现，不作为规则判断来源。

## 当前重点

- `Main`/脚本层 teardown：清理 frameLoop、stage event 和背景音乐。
- 网络回包 command/event 化，继续降低 `GameScene` 对具体 system 的感知。
- ECS/dirty 调试工具：实体快照、组件 dump、dirty bit 名称解析。
- 真实 socket 接入点整理，保留 `KickSocket` 的 seqId/pending 机制。
