---
name: ecs-binding
description: Use when changing ECS components, EntityDefinition definitions, systems, ProjectionDefinition mappings, ProjectionRuntime behavior, typed effects, or view synchronization in this project.
---

# ECS Binding

## 先读

- `AGENTS.md`
- `docs/ecs-binding.md`
- 跨模块改动再读 `docs/architecture.md`
- 架构判断使用全局 skill `ecs-feature-assembly`

## 工作流

1. 找到权威 component，以及负责写入的 system/helper。
2. 定义或更新本切片的 `EntityDefinition` 初始化契约。
3. 保持 system 纯净：不引入 Laya node、registry、resource loader 或 view callback。
4. 持久可见状态走 view contract 和 `*Projection.ts`。
5. reward、miss 等瞬时事实走 typed Effect。
6. Feature setup 保留真实业务拓扑，例如一个 Hole 拥有一个 Shrew。
7. 初始化阶段优先固定拓扑或对象池；运行期复用 entity/node。
8. 先跑窄测试，再跑类型检查和必要的全量测试。

## 常用测试

```bash
npm test -- --run src/tests/ecs/EntityRuntime.test.ts
npm test -- --run src/tests/sync/ProjectionDefinition.test.ts src/tests/sync/ProjectionRuntime.test.ts
npm test -- --run src/tests/sync/CoreViewSync.test.ts src/tests/sync/FeatureViewSync.test.ts
npm test -- --run src/tests/effects
npx tsc --noEmit
```

## Review Checklist

- Component 仍是权威状态。
- Entity 基数和初始化显式。
- Projection watch 了所有可见字段；规则字段用 `noProjection`。
- 共用 apply 函数能去重耦合 row。
- Feature 是装配层，不承载规则分支。
- 业务不依赖 dirty array、registry key、full sync 标志或全局字符串事件。
- world teardown 会清理 `EffectRuntime`、`ProjectionRuntime`、`ViewRegistry`、`EntityRuntime`。
