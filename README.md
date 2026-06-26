# laya-ecs-kickshrew

LayaAir3 + TypeScript + bitecs 打地鼠原型。ECS 承载权威状态和规则，ProjectionRuntime 差量同步 Laya 节点，typed EffectRuntime 处理 reward/miss 等瞬时表现。

## Quick Start

```bash
npm install
npm test
npx tsc --noEmit
npm run debug:ready
```

调试页：

```text
http://localhost:8080/debug-tsc.html
http://localhost:8080/debug-tsc.html?perf=1&heroes=200
```

`debug:ready` 会重新构建 debug 输出，并把服务固定绑定到 `0.0.0.0:8080`。

## Project Map

```text
src/app/                 Laya 应用壳、GameScene、GameLoopPipeline
src/framework/ecs/       EntityDefinition / EntityRuntime
src/framework/feature/   Feature Manifest、Registry、mount 原语
src/framework/sync/      Projection / Effect definition and runtime
src/framework/view/      ViewRegistry 与 Laya 版本兼容层
src/game/features/       shrew、hammer、playerHud、monster、perfHero
src/game/session/        输入、回包和跨 Feature 编排
src/game/GameFeatures.ts 显式 Feature 注册
src/network/             KickSocket、NetworkAdapter、MockServer
src/resource/            atlas/plist 转换与资源路径映射
src/config/              少量真正跨业务配置
src/tests/               Vitest 测试

assets/                  Laya 工程资源
bin/                     浏览器运行和调试入口
docs/                    项目知识库
.codex/skills/           项目级 Codex 工作流
```

`src1/` 是历史 Lua/Cocos 参考，不是当前运行主线。

## Reading Guide

按目的读，不要从头扫所有文档：

1. 新人熟悉项目：[docs/getting-started.md](docs/getting-started.md)
2. 看模块职责和依赖方向：[docs/architecture.md](docs/architecture.md)
3. 改 ECS、Projection、Effect：[docs/ecs-binding.md](docs/ecs-binding.md)
4. 改 Laya 节点、资源、生命周期：[docs/laya-rules.md](docs/laya-rules.md)
5. 做性能压测：[docs/performance-tuning.md](docs/performance-tuning.md)
6. 改 protobuf/socket 协议：[docs/protocol.md](docs/protocol.md)
7. 选测试命令和 debug 流程：[docs/test-guide.md](docs/test-guide.md)

`AGENTS.md` 是给 Codex/Agent 的硬规则入口；人读 README 和 docs 即可。

## Runtime Outline

```text
GameScene.init
  -> create world and runtimes
  -> bootstrap singleton entities
  -> feature setup creates topology, pools, views and handlers
  -> initial projection sync

frame
  -> state systems
  -> network.update
  -> feature systems
  -> projection mark/sync
  -> effect flush
```

退出场景时销毁 network、views、effect/projection/entity runtime 和 world；下一次进入整体重建。

## Adding Gameplay

业务采用纵向切片：

```text
src/game/features/foo/
  FooComponents.ts
  FooEntities.ts
  FooSystems.ts
  FooProjection.ts
  FooViewContract.ts
  FooNode.ts
  FooFeature.ts
  index.ts
```

新增业务主要在自己的目录内完成，只在 `src/game/GameFeatures.ts` 增加一行显式注册。运行期优先固定槽位或池，不依赖频繁 `removeEntity`。

## Verification

常用收尾：

```bash
git diff --check
npm test
npx tsc --noEmit
```

运行时、画面、资源、输入、生命周期、网络相关改动继续跑：

```bash
npm run debug:ready
```
