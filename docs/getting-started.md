# Getting Started

这份文档给第一次进入项目的人建立最小上下文。完整模块边界看 `docs/architecture.md`，ECS API 细节看 `docs/ecs-binding.md`。

## First Run

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

`debug:ready` 会构建 debug 输出并启动固定的 `0.0.0.0:8080` 服务。

## Mental Model

```text
input / network
  -> game/session
  -> ECS component
  -> ProjectionRuntime
  -> view contract
  -> Laya node

transient result
  -> EffectRuntime.emit
  -> frame-end flush
  -> feature handler
  -> Laya node
```

权威状态在 bitecs component typed arrays。Laya 节点只表现状态，不决定规则。

## Code Reading Path

1. `src/app/GameScene.ts`：world、runtime、FeatureRegistry 的装配。
2. `src/app/GameLoopPipeline.ts`：每帧 state/network/feature/projection/effect 顺序。
3. `src/game/GameFeatures.ts`：显式业务组合根。
4. `src/game/features/shrew/ShrewFeature.ts`：固定拓扑示例。
5. `src/game/features/monster/MonsterFeature.ts`：固定池示例。
6. `src/game/session/KickInputController.ts` 和 `KickResponseFlow.ts`：输入/回包进入 ECS 的路径。

## First Change

改规则：

```text
feature system/helper -> component -> tests
```

改持久表现：

```text
component field -> view contract -> projection row -> node method
```

改一次性表现：

```text
defineEffect -> emit -> feature handler -> effect node
```

新增业务通常只在 `src/game/features/foo/` 内完成，再到 `src/game/GameFeatures.ts` 增加一行显式注册。

## Common Checks

```bash
npm test -- --run src/tests/architecture
npm test -- --run src/tests/features
npm test -- --run src/tests/sync
npm test -- --run src/tests/game/features/monster
npm test -- --run src/tests/game/features/perfHero
npx tsc --noEmit
```

运行时可见改动继续跑 `npm run debug:ready` 并打开浏览器入口。

## Read Next

- `docs/architecture.md`：模块职责、依赖方向、生命周期 owner。
- `docs/ecs-binding.md`：EntityDefinition、ProjectionDefinition、EffectRuntime 的具体写法。
- `docs/laya-rules.md`：Laya 生命周期、资源加载、坐标和 atlas 注意事项。
- `docs/test-guide.md`：测试命令、debug 服务和提交检查。
