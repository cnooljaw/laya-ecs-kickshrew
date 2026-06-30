# 入门

这份文档帮助第一次进入项目的人跑起来、读第一条链路、完成第一次改动。模块边界看 `docs/architecture.md`；ECS API 看 `docs/ecs-binding.md`。

## 第一次运行

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

`debug:ready` 会构建 debug 输出，并启动固定的 `0.0.0.0:8080` 服务。

## 最小心智模型

```text
input / network
  -> game/session
  -> ECS component
  -> ProjectionRuntime
  -> I* 接口
  -> Laya node

transient result
  -> EffectRuntime.emit
  -> frame-end flush
  -> feature handler
  -> Laya node
```

权威状态在 bitecs component typed arrays。Laya 节点只表现状态，不决定规则。

## 读代码路径

1. `src/app/GameScene.ts`：创建 world、runtime、FeatureRegistry。
2. `src/app/GameLoopPipeline.ts`：每帧 state、network、feature、projection、effect 顺序。
3. `src/game/GameFeatures.ts`：显式业务组合根。
4. `src/game/features/shrew/ShrewFeature.ts`：固定拓扑示例。
5. `src/game/features/monster/MonsterFeature.ts`：固定池示例。
6. `src/game/session/KickInputController.ts`：输入进入 ECS。
7. `src/game/session/KickResponseHandler.ts`：回包进入 ECS 和 Effect。

## 第一次改动

改规则：

```text
feature system/helper -> component -> tests
```

改持久表现：

```text
component field -> I* 接口 -> projection row -> node method
```

改一次性表现：

```text
defineEffect -> emit -> feature handler -> effect node
```

新增业务通常只改 `src/game/features/foo/`，再到 `src/game/GameFeatures.ts` 增加一行显式注册。

## 常用检查

```bash
npm test -- --run src/tests/architecture
npm test -- --run src/tests/features
npm test -- --run src/tests/sync
npm test -- --run src/tests/game/features/monster
npm test -- --run src/tests/game/features/perfHero
npx tsc --noEmit
```

运行时可见改动继续跑 `npm run debug:ready` 并打开浏览器入口。

## 下一步

- `docs/architecture.md`：模块职责、依赖方向、生命周期 owner。
- `docs/ecs-binding.md`：EntityDefinition、ProjectionDefinition、EffectRuntime 的写法。
- `docs/laya-rules.md`：Laya 生命周期、资源加载、坐标和 atlas 规则。
- `docs/test-guide.md`：测试命令、debug 服务和提交检查。
