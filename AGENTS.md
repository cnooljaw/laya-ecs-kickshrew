# AGENTS.md

本文件是 Agent 进入项目后的必读入口，只放硬规则和索引。

## 项目定位

- LayaAir3 + TypeScript + bitecs 打地鼠原型。
- 当前运行主线在 `src/`；`src1/` 仅作 Lua/Cocos 历史参考。
- ECS 承载权威状态和规则；ProjectionRuntime 差量投影到 Laya；EffectRuntime 传递瞬时表现事实。
- 一般只有一个 world。退出场景时整批销毁 runtime/world，重新进入时重新创建。
- 运行期通常不 `removeEntity`；Shrew、Monster、PerfHero 使用固定槽位或池，初始化阶段允许较厚封装。

## 优先阅读

1. `AGENTS.md`
2. 按任务选择：
   - 架构与运行流：`docs/architecture.md`
   - ECS、Entity、Projection、Effect：`docs/ecs-binding.md`
   - Laya 生命周期与资源：`docs/laya-rules.md`
   - 性能压测：`docs/performance-tuning.md`
   - 协议：`docs/protocol.md`
   - 测试与调试：`docs/test-guide.md`
3. 代码结构、调用链和 bug 优先用 codegraph。

## 核心运行流

```text
GameScene.init
  -> create world
  -> compile EntityRuntime / ProjectionRuntime / EffectRuntime
  -> bootstrap singleton entities
  -> Feature setup creates topology, pools and views
  -> projectionRuntime.mark/sync initial state

frame
  -> state systems
  -> network.update
  -> feature systems
  -> projectionRuntime.mark
  -> projectionRuntime.sync
  -> effectRuntime.flush
```

## 强制边界

- `src/ecs/**`：权威状态与纯规则，不使用 `Laya.*`。
- `src/ecs/runtime/**`：EntityType 与 EntityRuntime。
- `src/sync/projection/**`：通用投影定义和执行器。
- `src/sync/projections/**`：业务 component 到 view contract 的声明式投影。
- `src/effects/**`：按 definition identity 区分的 typed 瞬时事件。
- `src/features/**`：薄装配层，只声明 entities、systems、projections 和真实业务拓扑。
- `src/view/**`：Laya 表现、输入和运行时壳。
- `src/network/**`：协议、请求匹配和 transport；回包不得直接操作 view。

依赖方向：

```text
input/network callback
  -> adapter
  -> ECS system/domain helper
  -> Component
  -> ProjectionRuntime
  -> view contract
  -> Laya node

transient result
  -> typed EffectRuntime
  -> view handler
```

禁止业务维护 dirty bit、dirty target、registry key、full sync 标志或全局字符串 EventBus。

## 常见入口

- 状态机：`src/ecs/gameplay/core/ShrewStateSystem.ts`
- 命中：`src/ecs/gameplay/core/HitDetectionSystem.ts`
- Entity 声明：`src/ecs/gameplay/**/**Entity.ts`
- 投影：`src/sync/projections/*.ts`
- 瞬时效果：`src/effects/*.ts`
- Feature 装配：`src/features/*Feature.ts`
- Laya 表现：`src/view/*Node.ts`
- 运行时：`src/view/GameScene.ts`、`src/view/GameLoopPipeline.ts`

## 工作流

- 默认 TDD：确认基线 -> Red -> 最小实现 -> 窄测试 -> 全量测试。
- 改运行时/画面/资源/输入/生命周期后运行 `npm run debug:ready`。
- 有效改动默认提交。不要丢弃用户改动，不使用破坏性 git 命令。
- 查文件优先 `rg`/`rg --files`，默认不读 `node_modules/`。

## 项目 Skills

- `.codex/skills/ecs-binding/SKILL.md`：Entity/Projection/Effect 工作流。
- `.codex/skills/laya-runtime/SKILL.md`：Laya 节点和生命周期。
- `.codex/skills/test-workflow/SKILL.md`：测试、调试构建和提交。
- `.codex/skills/hole-position-tuning/SKILL.md`：洞位和地鼠视觉对齐。
