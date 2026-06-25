# 测试、调试与提交指南

## 默认 TDD

1. 读现有行为和边界。
2. 跑窄测试确认基线。
3. 先写失败契约。
4. 最小实现。
5. 跑窄测试、类型检查和必要的全量测试。
6. 运行时可见改动执行 `npm run debug:ready` 和浏览器验证。
7. 提交相关文件。

## 常用命令

```bash
npm test
npx tsc --noEmit
```

Entity 与 Projection：

```bash
npm test -- --run src/tests/ecs/EntityRuntime.test.ts
npm test -- --run src/tests/sync/ProjectionDefinition.test.ts src/tests/sync/ProjectionRuntime.test.ts
npm test -- --run src/tests/sync/CoreViewSync.test.ts src/tests/sync/FeatureViewSync.test.ts src/tests/sync/HudViewSync.test.ts
```

Effect：

```bash
npm test -- --run src/tests/effects
```

核心规则：

```bash
npm test -- --run src/tests/ecs/ShrewStateSystem.test.ts
npm test -- --run src/tests/ecs/HitDetectionSystem.test.ts src/tests/ecs/HitResponseSystem.test.ts
npm test -- --run src/tests/ecs/gameplay/monster/MonsterSystem.test.ts
```

架构边界与生命周期：

```bash
npm test -- --run src/tests/architecture/FrameworkBoundary.test.ts
npm test -- --run src/tests/features src/tests/view/GameScene.test.ts
```

## 覆盖重点

- EntityType 基数、默认值和固定 topology。
- state/network/feature/projection/effect 顺序。
- Projection 初次同步、差量比较和 apply 去重。
- typed Effect 的 enqueue/flush/clear。
- Shrew 状态机、命中、Hammer、Player 回包。
- Monster 固定池、tracker 数量和不删除实体策略。
- world 退出时 runtime、node、effect handler 和 snapshot 清理。
- protobuf、seqId、超时与乱序回包。
- Laya 节点池化、异步资源 stale guard 和 destroy。

## Debug

```bash
npm run debug:ready
```

页面：

```text
http://localhost:8080/debug-tsc.html
http://localhost:8080/debug-tsc.html?perf=1&heroes=200
```

`debug:ready` 会编译 TypeScript、修复 ESM 扩展、复制 vendor/资源并确认 8080 服务。

改动以下区域必须优先做浏览器验证：

- GameScene / GameLoopPipeline
- Feature setup
- Projection 或 Effect 到具体 Laya 节点
- 输入、网络回包、资源、timer/tween、destroy

## 调试路径

画面不同步：

```text
system component value
  -> Projection watched fields
  -> projection mount eid/node
  -> contract method
  -> concrete Node state
```

瞬时效果：

```text
adapter emit
  -> same EffectDefinition identity
  -> GameLoopPipeline.flush
  -> Feature handler
  -> effect node
```

常用日志：

- `hit.blocked`：锤子冷却，不是坐标 miss。
- `hit.miss`：命中检测未找到目标。
- `score.applied`：回包已更新 ECS。
- `binding.dizzyAnimation`：历史日志名，表示 ShrewProjection 已投影 Dizzy 动画。

## 提交

默认提交有效改动。提交前至少确认：

```bash
git diff --check
npm test
npx tsc --noEmit
```

不要提交 `bin/js/debug` 等生成物。
