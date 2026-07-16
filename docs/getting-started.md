# 入门

这份文档帮助第一次进入项目的人跑起来、读第一条链路、完成第一次改动。模块边界看 `docs/architecture.md`；ECS API 看 `docs/ecs-binding.md`；设计思路看 `docs/typescript-architecture.md`。

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
2. `src/app/GameLoopPipeline.ts`：每帧 network、ingress、state、gameplay、derived、projection、effect 顺序。
3. `src/game/GameFeatures.ts`：显式业务组合根。
4. `src/game/board/BoardFoundation.ts`：基础棋盘拓扑和洞位占用入口。
5. `src/game/features/shrew/ShrewFeature.ts`：固定拓扑示例。
6. `src/game/features/monster/MonsterFeature.ts`：固定池和 setup-time system 示例。
7. `src/game/session/KickInputController.ts`：输入进入 ECS。
8. `src/game/session/KickResponseHandler.ts`：回包进入 ECS 和 Effect。

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

新增业务通常只改 `src/game/features/foo/`，再到 `src/game/GameFeatures.ts` 增加一行显式注册。跨模块调用看 `index.ts`，组合根材料看 `assembly.ts`；测试具体规则时看被测文件。
需要洞位、坐标或占用关系时，依赖 `src/game/board/index.ts` 的公开 API，不把 board 当普通业务 Feature 复制一套。

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

UI 调试页面索引看 `docs/ui-debugging-guide.md`。洞位、Shrew 站位、Monster 三角落点和 Spine 叠影不要只靠主页面猜，先用对应预览页定位。

## 下一步

- `docs/architecture.md`：模块职责、依赖方向、生命周期 owner。
- `docs/typescript-architecture.md`：函数优先、数据驱动、组合、依赖注入和声明式注册如何落在代码中。
- `docs/gameplay-assembly.md`：board、session 和跨 Feature 玩法组装。
- `docs/ecs-binding.md`：EntityDefinition、ProjectionDefinition、EffectRuntime 的写法。
- `docs/laya-rules.md`：Laya 生命周期、资源加载、坐标和 atlas 规则。
- `docs/ui-debugging-guide.md`：Shrew 洞位、Monster 三角落点和 Spine 表现调试。
- `docs/test-guide.md`：测试命令、debug 服务和提交检查。
