# AGENTS.md

本文件给后续重新开启会话的 Codex/Agent 使用。进入本项目后，优先读取本文件，再按需读取 `docs/LayaAir3-Project-Onboarding.md`。

## 项目信息

- 项目名称：`laya-ecs-kickshrew`
- 项目类型：LayaAir3 + TypeScript 打地鼠游戏原型
- 当前核心目标：用 `bitecs` 承载游戏状态和规则，用 dirty binding 将 ECS 数据差量同步到 Laya 节点。
- 学习目标：本项目不只追求功能完成，还要把 ECS、dirty binding、Laya 表现层解耦、资源迁移和网络边界讲清楚，形成可复用的教学材料。
- 架构目标：在保留 ECS 可测试、数据驱动优势的同时，主动规避 ECS 在小型游戏项目中常见的调试困难、状态分散、样板代码膨胀、生命周期不清和视图同步遗漏问题。
- 迁移背景：`src1/` 是历史 Lua/Cocos 参考实现；当前运行主线在 `src/`。
- 主要教程文档：`docs/LayaAir3-Project-Onboarding.md`

核心目录：

```text
src/
  Main.ts                 Laya 脚本入口
  ecs/                    bitecs world、components、systems
  binding/                ECS -> Laya 节点的 dirty binding
  view/                   Laya 节点封装与表现层
  network/                协议、KickSocket、NetworkAdapter、MockServer
  resource/               atlas/plist 转换与资源路径映射
  config/                 地图、洞位、锤子、地鼠资源配置
  tests/                  Vitest 测试

src1/                     老 Lua/Cocos 参考实现
assets/                   Laya 工程资源
bin/                      浏览器运行和调试入口、运行资源
engine/types/             Laya/编辑器类型定义
docs/                     项目文档
```

## 技术栈

- 引擎：LayaAir3
- 语言：TypeScript
- ECS：`bitecs`
- 测试：Vitest
- 资源：Laya atlas；部分资源由 Cocos plist 转换而来
- 网络：当前使用 `MockServer` 模拟击打回包；`KickSocket` 提供 `seqId`、pending request、乱序回包和超时处理

运行主线：

```text
Main.ts
  -> GameScene.init()
  -> createGameWorld/createSingletonEntities/createHoleEntities/createShrewEntity
  -> 创建 Laya 节点并 registerXxxNode
  -> 注册 SyncView bindings
  -> Laya.timer.frameLoop
  -> GameScene.update(delta)
```

每帧系统顺序：

```text
animationTimerSystem
shrewStateSystem
sceneCycleSystem
hammerSystem
network.update
dirtyMarkSystem
syncView.sync
```

点击流程：

```text
Laya stage MOUSE_DOWN
  -> GameScene.onTouch(x, y)
  -> hitDetectionSystem(world, xRatio, yRatio)
  -> comboSystem
  -> NetworkAdapter.sendKick
  -> KickSocket
  -> MockServer
  -> hitResponseSystem
```

## 项目定位：代码 + 教学 + 架构实验

这是一个学习项目。后续 Agent 不能只把功能“做完”，还要同步沉淀为什么这样做、有什么取舍、容易踩哪些坑。

每次有效改动优先同时满足三件事：

1. **代码优雅**：边界清晰、命名准确、测试覆盖关键规则、避免把 Laya 节点当状态源。
2. **教学清晰**：让后来者能从入口、数据流、系统顺序和 Q&A 理解改动，不需要猜。
3. **架构升级**：每次改动都尽量降低 ECS 的副作用，而不是继续堆组件、dirty bit 和散落的单例。

如果代码改动涉及 ECS、binding、网络、生命周期、资源加载、坐标转换或调试链路，应同步评估是否需要更新：

- `docs/LayaAir3-Project-Onboarding.md`
- 本文件的“当前优先级建议”
- 新增或更新相关 Q&A
- 相关测试说明或调试说明

## 架构边界

保持以下边界，不要随意打穿：

- `src/ecs/**`：游戏规则和状态。默认不直接使用 `Laya.*`。
- `src/binding/**`：从 ECS 读取 dirty 数据，调用 view node 接口。
- `src/view/**`：Laya 表现层，可以使用 `Laya.*`。
- `src/network/**`：协议、请求匹配、mock 网络。真实 socket 接入应优先替换 transport，不要让 view 直接读 socket。
- `src/config/**`：静态配置。
- `src/resource/**`：资源路径、plist/atlas 转换工具。

依赖方向应尽量保持：

```text
ecs systems -> ecs components/types + config
binding -> ecs components + view interfaces
view -> Laya + resource/config
GameScene -> 运行时装配
```

架构升级时优先保持以下方向：

```text
input/network/resource callback
  -> command/event adapter
  -> ECS systems / domain services
  -> dirty state
  -> binding projection
  -> Laya view nodes
```

可以保留 `GameScene` 作为当前阶段的总装配器，但新增复杂逻辑时应优先下沉到可测试模块：

- 输入坐标、点击意图、协议回包：先转成 command/event，再进入系统。
- 地鼠、锤子、场景、玩家规则：放在 ECS system 或纯函数 helper。
- Laya 节点、音效、动画、异步资源：放在 view/runtime adapter。
- 运行时装配、实体和节点映射：保留在 `GameScene` 或专门 registry，不让 view 自己查 ECS。

新增 ECS 字段并显示到画面时，通常需要同步修改：

1. `src/ecs/components/index.ts`
2. `src/ecs/world.ts`
3. 对应 `src/ecs/systems/*.ts`
4. `src/binding/DirtyFlags.ts`
5. dirty mark 或系统内手动 dirty 标记
6. 对应 `src/binding/*ViewBinding.ts`
7. 对应 `src/view/*Node.ts`
8. 对应 `src/tests/**/*.test.ts`

## ECS 教学与架构升级规范

### 教学产出要求

当改动能体现 ECS 思路时，回答或文档里要尽量说明：

- **权威状态在哪里**：对应 component 字段是什么，谁负责写。
- **规则在哪里执行**：哪个 system 或纯函数改变了状态。
- **表现如何同步**：dirty bit 如何产生，哪个 binding 读取，哪个 view node 展示。
- **为什么不用传统节点状态**：说明这样做带来的测试性、解耦或调试收益。
- **代价是什么**：例如字段链路变长、dirty 容易漏、entity id 映射难读。

推荐解释模板：

```text
需求/现象
  -> ECS 数据建模
  -> System 规则流
  -> Dirty 标记
  -> Binding 到 Laya
  -> 测试和调试入口
  -> Q&A：为什么这么做/可能出什么问题
```

### ECS 缺点规避清单

使用 ECS 时要主动控制这些风险：

- **状态分散**：新增组件字段前先判断是否属于已有组件、单例组件、临时 view state，避免把一次性表现状态放进权威 ECS。
- **样板膨胀**：新增 dirty bit、binding、node 方法时保持命名一一对应；如果同类字段重复增长，考虑抽 helper 或 projection。
- **调试困难**：复杂 system 要能从测试里重放；关键状态变化优先在 system 边界写清楚输入、输出和测试断言。
- **同步遗漏**：任何 ECS 字段如果需要显示到画面，必须同时检查 dirty 标记和 binding；不要依赖 `forceFullSync` 掩盖常规同步缺口。
- **生命周期不清**：ECS world、view node、timer、stage event、network callback、sound/tween 必须有明确 owner 和 teardown。
- **过度 ECS 化**：纯视觉动画进度、临时按钮 hover、一次性粒子生命周期不一定进入 ECS；进入 ECS 的条件是它影响规则、同步、回放、测试或网络一致性。
- **系统顺序隐式依赖**：新增 system 时必须说明它在帧循环中的位置，以及依赖哪个上游 system 的结果。
- **单例实体滥用**：Player/Hammer/Scene/Network 这类单例可以保留，但新增单例前先确认是否真的是全局状态。

### 架构升级优先级

后续重构优先围绕“让数据流更显性、让生命周期更可控”：

1. 恢复测试全绿，避免在不稳定基线上继续教学和重构。
2. 补齐 Player/Hammer/Scene/Hole/Hit 等组件的 dirty 标记策略，减少 `forceFullSync` 依赖。
3. 把输入、网络回包、场景切换整理成 command/event 入口，降低 `GameScene` 规则职责。
4. 完善 `GameScene.stop()` 和相关 registry 的清理，避免 Laya timer、stage event、binding、节点、音效泄漏。
5. 统一真实 `deltaSec` 与状态机计时，避免固定 `1/60` 隐式假设。
6. 为 ECS 调试补轻量工具：实体快照、关键组件 dump、dirty bit 名称解析。
7. 真实 socket 接入时保留 `KickSocket` 的 seqId/pending/乱序/超时机制，让 transport 可替换。

## Q&A 沉淀规范

当修复问题、升级架构或发现坑点时，要把可复用解释沉淀为 Q&A。可以写在相关文档章节中；如果 Q&A 变多，再拆成 `docs/Architecture-QA.md`。

Q&A 应回答真实疑问，而不是写口号。优先覆盖：

- 为什么这个状态放 ECS，而不是放 Laya 节点？
- 为什么 dirty binding 用拉取同步，而不是事件直接推 UI？
- 为什么 socket 回包不能直接操作 view？
- 为什么某个 system 必须排在另一个 system 前后？
- 为什么某个表现状态不进入 ECS？
- 为什么测试应该断言 component，而不是断言 Laya 节点？
- 如果画面没变，是 ECS 没变、dirty 没标、binding 没跑，还是 view node 没实现？
- 如果新增地图/地鼠/锤子资源，需要同步哪些配置和测试？

推荐格式：

```md
### Q: <具体问题>

A: <直接答案>

- 代码入口：`src/...`
- 数据流：`Component -> System -> Dirty -> Binding -> View`
- 常见坑：<1-3 条>
- 验证方式：<测试命令或调试页面>
```

## TDD 工作流

默认按 TDD 循环工作：

1. 先理解需求和现有测试。
2. 有相关测试时，先跑相关测试确认 Red/基线。
3. 没有相关测试时，尽量补最小相关测试。
4. 实现最小改动。
5. 跑相关测试；必要时跑更大范围测试。
6. 测试通过后提交 git commit。

文档、`.gitignore`、说明文件等没有可执行相关测试时：

- 不强行补无意义测试。
- 提交信息中写明 `TDD Red: 文档/配置变更，无对应自动化测试`。

当前全量测试命令：

```bash
npm test
```

当前项目基线状态：

- `npm test` 可以正常启动 Vitest。
- 最近基线：117 项测试全部通过。
- `DirtyMarkSystem` 已覆盖 Shrew/Animation/Hole/Hammer/Combo/Scene/Player/Hit 的字段差异，并有对应测试。

修复测试时，不要只改测试让它变绿；先判断代码行为与 Laya 运行时资源格式哪个是正确事实。

## Git 规范

默认每次有效改动都提交。提交信息可使用中文，格式保持 TDD 信息清晰。

推荐提交格式：

```text
<type>: <简短描述>

TDD Red: <先跑了什么测试，失败/基线是什么；没有测试时说明原因>

TDD Green: <做了什么让目标通过，或文档/配置完成了什么>

TDD Refactor: <是否有重构；没有就写“无”>
```

常用 type：

- `feat`: 新功能
- `fix`: 修复
- `test`: 测试
- `docs`: 文档
- `refactor`: 重构
- `chore`: 工程配置、忽略规则、构建脚本等

常用指令：

```bash
git status --short
git status --short --ignored
git diff
git diff --cached
git add <file>
git commit -m "<type>: <描述>" -m "TDD Red: ..." -m "TDD Green: ..." -m "TDD Refactor: ..."
git log --oneline --decorate -5
git show --stat --oneline HEAD
```

注意：

- 不要使用 `git reset --hard`、`git checkout -- <file>` 等会丢弃用户改动的命令，除非用户明确要求。
- 工作区可能有用户未提交改动。改文件前先看 `git status --short`。
- 如果遇到自己没改过的变更，默认认为是用户改动，不要还原。

## 忽略规则与生成物

默认不要提交：

- `node_modules/`
- `library/`
- `local/`
- `temp/`
- `release/`
- `.DS_Store`
- `bin/js/bundles/`
- `bin/js/game.js`
- `bin/js/game.js.map`
- `bin/js/debug/`

## 构建与调试

### 生产构建（esbuild，无 sourceMap）

```bash
npx esbuild src/Main.ts --bundle --format=iife --global-name=Game --platform=browser --target=es6 --external:Laya --outfile=bin/js/game.js
```

### 调试构建（tsc + sourceMap，VS Code 直接断点）

```bash
npm run build:debug
```

等价于：

```bash
npx tsc -p tsconfig.debug.json && node scripts/fix-esm-extensions.js && node scripts/copy-vendor.js
```

流程说明：

1. `tsc` 按 `tsconfig.debug.json` 编译，每个 TS 文件生成独立的 `.js` + `.js.map` 到 `bin/js/debug/src/`
2. `fix-esm-extensions.js` 后处理：给相对路径 import 添加 `.js` 扩展名（浏览器 ES module 必需）
3. `copy-vendor.js`：将 `bitecs` 和 `tslib` 的 ES module 复制到 `bin/js/debug/vendor/`

调试页面：`bin/debug-tsc.html`，通过 Import Map 映射裸模块 + `<script type="module">` 加载 `Bootstrap.js`。

`Bootstrap.ts` 是 ES module 入口，调用 `Laya.init + new Main().onStart()`，不改动 `Main.ts`。

### 本地 HTTP 服务

```bash
cd bin && python3 -m http.server 8080
```

调试页面访问地址：
- 生产：`http://localhost:8080`
- tsc 调试：`http://localhost:8080/debug-tsc.html`

### VS Code 断点调试（推荐）

1. `npm run build:debug`
2. 启动 HTTP 服务（端口 8080）
3. VS Code 按 `F5`，选择 **"tsc Debug"** 配置
4. 在 TS 源文件中直接设断点 — sourceMap 一级精确映射，断点命中

### esbuild + sourceMap 调试（备选）

```bash
npx esbuild src/Main.ts --bundle --format=iife --global-name=Game --platform=browser --target=es6 --external:Laya --outfile=bin/js/game.js --sourcemap
```

VS Code 按 `F5`，选择 "LayaAir Debug"。sourceMap 是二级链路（TS → bundle JS），断点精度不如 tsc 方案。

这类浏览器运行 bundle 和 tsc debug 输出都是生成物，不提交。`bin/js/libs/*.js` 是 Laya 运行库，不能因为 `game.js` 是生成物就粗暴忽略整个 `bin/js/`。

## 阅读和排查约定

- 默认不读 `node_modules/`。只有需要确认第三方库 API、类型或运行机制时才读取。
- 理解项目优先读：
  1. `AGENTS.md`
  2. `docs/LayaAir3-Project-Onboarding.md`
  3. `package.json`
  4. `src/Main.ts`
  5. `src/view/GameScene.ts`
  6. `src/ecs/components/index.ts`
  7. `src/ecs/systems/*.ts`
  8. `src/binding/SyncView.ts` 和 `src/binding/*ViewBinding.ts`
  9. `src/network/*.ts`
  10. `src/resource/AtlasConfig.ts`
- 查文件优先用 `rg` 或 `rg --files`。
- 资源、旧实现和迁移细节需要参考 `src1/`，但不要把 `src1/` 当当前运行主线。

## LayaAir3 注意事项

- ECS 是权威状态源，Laya 节点是表现层。
- 不要在 view node 中实现核心规则判断。
- 不要让 socket 回包直接驱动 Laya 节点，应先转成系统可消费的数据并更新 ECS。
- Laya 资源加载是异步的，节点销毁或切场景后回调可能迟到。新增异步加载时要加生命周期保护。
- Cocos 到 Laya 的坐标转换是高风险区：Cocos Y-up，Laya Y-down。
- atlas rotated/trimmed 帧是资源迁移高风险区。修改 `PlistConverter` 或 `ShrewNode` 前先看现有测试和实际 atlas 格式。

## 当前优先级建议

如果重新开始会话后要继续提升项目质量，建议优先处理：

1. 完善 `GameScene.stop()` 生命周期清理：timer、stage event、binding 注册表、节点、音效、network callback。
2. 统一 `ShrewStateSystem` 的固定 `1/60` timer 与真实 `deltaSec`，说明帧率变化对 ECS 状态机的影响。
3. 把点击输入和网络回包整理成 command/event 入口，降低 `GameScene` 直接编排规则的比例。
4. 为 dirty binding 和 entity/component 调试补轻量工具：实体快照、关键组件 dump、dirty bit 名称解析。
5. 梳理真实 socket 接入点，保留 `KickSocket` 的 seqId/pending 机制。
