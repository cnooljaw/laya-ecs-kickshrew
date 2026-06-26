# AGENTS.md

本文件是 Agent 进入项目后的必读入口，只放本仓库硬规则和索引。
通用工程判断使用全局 skills：`ecs-feature-assembly`、`layaair-developer`、`clean-coder-review`。

## 项目定位

- LayaAir3 + TypeScript + bitecs 打地鼠原型。
- 当前运行主线在 `src/`；`src1/` 仅作 Lua/Cocos 历史参考。
- ECS 承载权威状态和规则；ProjectionRuntime 差量投影到 Laya；EffectRuntime 传递瞬时表现事实。
- 一般只有一个 world。退出场景时整批销毁 runtime/world，重新进入时重新创建。
- 运行期通常不 `removeEntity`；Shrew、Monster、PerfHero 使用固定槽位或池，初始化阶段允许较厚封装。

## 文档索引

- 架构与目录：`docs/architecture.md`
- 新手入门：`docs/getting-started.md`
- ECS / Projection / Effect：`docs/ecs-binding.md`
- Laya 运行时：`docs/laya-rules.md`
- 性能压测：`docs/performance-tuning.md`
- 协议：`docs/protocol.md`
- 测试与调试：`docs/test-guide.md`

代码结构、调用链和 bug 优先用 codegraph。

## 运行流

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

## 目录边界

- `src/framework/ecs/**`：EntityDefinition / EntityRuntime。
- `src/framework/feature/**`：Feature Manifest、Registry、mount 原语。
- `src/framework/sync/**`：Projection / Effect 定义和运行时。
- `src/framework/view/**`：ViewRegistry 与容易随 Laya 版本变化的窄兼容层。
- `src/game/features/<name>/**`：业务纵向切片，拥有 Component、Entity、System、Projection、contract、Node 和配置。
- `src/game/session/**`：跨 Feature 规则与输入/回包编排，只依赖各 Feature 的公开 `index.ts`。
- `src/app/**`：Laya 应用壳、world/runtime 组装和主循环。
- `src/network/**`：协议、请求匹配和 transport；回包不得直接操作 view。

`framework` 不得依赖 `game/app`；Feature 不得导入另一个 Feature 的内部文件。

```text
input/network callback
  -> game/session
  -> Feature system/domain helper
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

- 状态机：`src/game/features/shrew/ShrewStateSystem.ts`
- 命中/输入：`src/game/session/KickDetection.ts`、`KickInputController.ts`
- 回包：`src/game/session/KickResponseFlow.ts`
- 业务切片：`src/game/features/{shrew,hammer,playerHud,monster,perfHero}`
- Feature 注册：`src/game/GameFeatures.ts`
- 运行时：`src/app/GameScene.ts`、`src/app/GameLoopPipeline.ts`

## 新增 Feature

1. 创建 `src/game/features/foo/`。
2. 在目录内定义 Component、Entity、System、Projection、contract、Node、规则和表现配置。
3. 用 `defineFeature`、`defineSystem`、`mountOne/mountPool/createView/own` 装配。
4. 只从 `index.ts` 暴露外部真正需要的能力。
5. 在 `src/game/GameFeatures.ts` 增加显式 import 和一个数组项。

禁止 BaseFeature、目录自动扫描、反射注册、`mountTree` 和通用 UI DSL。

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
