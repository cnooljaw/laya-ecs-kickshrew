# laya-ecs-kickshrew

LayaAir3 + TypeScript + bitecs 打地鼠原型。ECS 保存权威状态，`ProjectionRuntime` 把状态差量同步到 Laya，`EffectRuntime` 处理 reward、miss 等瞬时事实。

## 快速开始

```bash
npm install
npm test
npx tsc --noEmit
npm run debug:ready
```

浏览器入口：

```text
http://localhost:8080/debug-tsc.html
http://localhost:8080/debug-tsc.html?perf=1&heroes=200
```

`debug:ready` 会重新构建 debug 输出，并把服务绑定到 `0.0.0.0:8080`。

## 项目地图

```text
src/app/                  Laya 应用壳、GameScene、GameLoopPipeline
src/framework/ecs/        EntityDefinition / EntityRuntime
src/framework/feature/    Feature Manifest、Registry、mount 原语
src/framework/sync/       Projection / Effect definition and runtime
src/framework/view/       ViewRegistry 与 Laya 窄兼容层
src/game/features/        shrew、hammer、playerHud、monster、perfHero
src/game/session/         输入、回包和跨 Feature 编排
src/game/GameFeatures.ts  显式 Feature 组合根
src/network/              KickSocket、NetworkAdapter、MockServer
src/resource/             atlas/plist 转换与资源路径映射
src/config/               少量跨业务配置
src/tests/                Vitest 测试
```

`src1/` 是历史 Lua/Cocos 参考，不是当前运行主线。

## 阅读路线

按目的读：

1. 新人跑起来并读第一条链路：[docs/getting-started.md](docs/getting-started.md)
2. 理解模块职责和依赖方向：[docs/architecture.md](docs/architecture.md)
3. 修改 Entity、Projection、Effect：[docs/ecs-binding.md](docs/ecs-binding.md)
4. 修改 Laya 节点、资源或生命周期：[docs/laya-rules.md](docs/laya-rules.md)
5. 做性能压测：[docs/performance-tuning.md](docs/performance-tuning.md)
6. 同步 protobuf/socket 协议：[docs/protocol.md](docs/protocol.md)
7. 选择测试命令和 debug 流程：[docs/test-guide.md](docs/test-guide.md)

`AGENTS.md` 是给 Codex/Agent 的硬规则入口；人读 README 和 docs 即可。

## 加业务

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

新增业务主要在自己的目录内完成，只在 `src/game/GameFeatures.ts` 增加一行显式注册。运行期优先使用固定槽位或对象池，不依赖频繁 `removeEntity`。

## 收尾验证

```bash
git diff --check
npm test
npx tsc --noEmit
```

改运行时、画面、资源、输入、生命周期或网络时继续跑：

```bash
npm run debug:ready
```
