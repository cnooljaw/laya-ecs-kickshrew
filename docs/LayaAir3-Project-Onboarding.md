# LayaAir3 项目入门

本项目是 LayaAir3 + TypeScript + bitecs 打地鼠原型。权威状态在 ECS，Laya 只负责表现。

## 先跑起来

```bash
npm install
npm test
npx tsc --noEmit
npm run debug:ready
```

打开：

```text
http://localhost:8080/debug-tsc.html
http://localhost:8080/debug-tsc.html?perf=1&heroes=200
```

## 当前目录

```text
src/framework/ecs       EntityDefinition / EntityRuntime
src/framework/feature   Feature Manifest / Registry / mount primitives
src/framework/sync      Projection / Effect definition and runtime
src/framework/view      Laya version-sensitive adapters and ViewRegistry
src/game/features       vertical business slices
src/game/session        input, response and cross-feature orchestration
src/game/GameFeatures.ts explicit composition root
src/app                 Laya shell, GameScene and frame pipeline
src/network             protobuf, socket, mock server
src/resource            atlas and resource tools
src/config              small truly shared config
```

## Runtime Flow

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

退出场景时销毁 network、views、effect/projection/entity runtime 和 world；重新进入时整体重建。

## Adding A Feature

新增业务通常只改自己的切片和组合根：

```text
src/game/features/foo/FooComponents.ts
src/game/features/foo/FooEntities.ts
src/game/features/foo/FooSystems.ts
src/game/features/foo/FooProjection.ts
src/game/features/foo/FooViewContract.ts
src/game/features/foo/FooNode.ts
src/game/features/foo/FooFeature.ts
src/game/features/foo/index.ts
src/game/GameFeatures.ts
```

运行期优先复用固定 entity/node 槽位。初始化阶段可以用更厚的封装换取清晰边界。

## Debug Order

规则错误：

```text
input/response -> session/system/helper -> component
```

表现错误：

```text
component -> projection -> contract -> node
```

瞬时效果错误：

```text
emit -> EffectDefinition identity -> flush -> handler -> node
```

## Read Next

- 架构和边界：`docs/architecture.md`
- ECS 绑定：`docs/ecs-binding.md`
- Laya 生命周期：`docs/laya-rules.md`
- 测试和调试：`docs/test-guide.md`
