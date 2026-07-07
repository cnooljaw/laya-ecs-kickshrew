# laya-ecs-kickshrew

LayaAir3 + TypeScript + bitecs 打地鼠原型。ECS component 保存权威状态，`ProjectionRuntime` 差量同步到 Laya 节点，`EffectRuntime` 处理 reward、miss、飘字这类瞬时事实。

这份 README 只做入口索引：帮助你跑起来、知道代码放哪、选择下一份文档。

## 快速开始

```bash
npm install
npm test
npx tsc --noEmit
npm run debug:ready
```

常用浏览器入口：

```text
http://localhost:8080/debug-tsc.html
http://localhost:8080/debug-tsc.html?perf=1&heroes=200
```

`debug:ready` 会重新构建 debug 输出，并确认 `8080` 服务可用。

## 项目地图

```text
src/app/                  Laya 应用壳、GameScene、GameLoopPipeline
src/framework/ecs/        EntityDefinition / EntityRuntime / GameWorld
src/framework/feature/    Feature Manifest、Registry、FeatureSetupContext
src/framework/sync/       Projection / Effect definition and runtime
src/framework/view/       ViewRegistry 与 Laya 窄兼容层
src/game/board/           棋盘基础层：Scene、Hole、BoardPosition、拓扑和占用操作
src/game/features/        shrew、hammer、playerHud、monster、perfHero
src/game/session/         输入、回包和跨 Feature 编排
src/game/GameFeatures.ts  foundation、feature、session system 的显式组合根
src/network/              KickSocket、NetworkAdapter、MockServer
src/resource/             atlas/plist 转换与资源路径映射
src/config/               少量跨业务配置
src/tests/                Vitest 测试
```

`src1/` 是 Lua/Cocos 历史参考，不是当前运行主线。

## 阅读路线

按目的读：

| 目的 | 文档 |
| --- | --- |
| 第一次运行、读第一条链路 | [docs/getting-started.md](docs/getting-started.md) |
| 理解模块职责、依赖方向、生命周期 | [docs/architecture.md](docs/architecture.md) |
| 理解 board、session 和跨 Feature 玩法组装 | [docs/gameplay-assembly.md](docs/gameplay-assembly.md) |
| 修改 Entity、Projection、Effect、board 占用 | [docs/ecs-binding.md](docs/ecs-binding.md) |
| 修改 Laya 节点、资源加载、生命周期 | [docs/laya-rules.md](docs/laya-rules.md) |
| 校准洞位、Shrew 站位、Monster 落点、Spine 表现 | [docs/ui-debugging-guide.md](docs/ui-debugging-guide.md) |
| 做性能压测 | [docs/performance-tuning.md](docs/performance-tuning.md) |
| 同步 protobuf/socket 协议 | [docs/protocol.md](docs/protocol.md) |
| 选择测试命令和 debug 流程 | [docs/test-guide.md](docs/test-guide.md) |
| 架构分享页 | [docs/ecs-framework-share.html](docs/ecs-framework-share.html) |

`AGENTS.md` 是给 Codex/Agent 的硬规则入口；人读 README 和 docs 即可。

## 调试页面索引

启动：

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

使用顺序见 [docs/ui-debugging-guide.md](docs/ui-debugging-guide.md)。预览页只验证单点表现；`debug-tsc.html` 才验证真实 ECS 主循环、地图切换、对象池复用、输入和网络回包。

## 加业务

业务采用纵向切片：

```text
src/game/features/foo/
  FooComponents.ts
  FooEntities.ts
  FooSystems.ts
  FooProjection.ts
  IFooNode.ts
  FooNode.ts
  FooFeature.ts
  index.ts
  assembly.ts
```

新增业务主要在自己的目录内完成，再到 `src/game/GameFeatures.ts` 显式注册。`index.ts` 暴露跨模块公开契约，`assembly.ts` 暴露组合根需要的 Feature、Entity 和 Projection。普通测试直接 import 被测文件。运行期优先使用固定槽位或对象池，不依赖频繁 `removeEntity`。

`board` 是基础层，不是普通业务 Feature。需要洞位、坐标、occupant、`BoardPositionComponent` 时，从 `src/game/board/index.ts` 使用公开 API；业务 Feature 之间仍不能互相导入内部文件。

## 收尾验证

提交前至少确认：

```bash
git diff --check
npm test
npx tsc --noEmit
```

改运行时、画面、资源、输入、生命周期或网络时继续跑：

```bash
npm run debug:ready
```
