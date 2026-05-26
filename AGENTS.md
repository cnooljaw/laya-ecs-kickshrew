# AGENTS.md

本文件给后续重新开启会话的 Codex/Agent 使用。进入本项目后，优先读取本文件，再按需读取 `docs/LayaAir3-Project-Onboarding.md`。

## 项目信息

- 项目名称：`laya-ecs-kickshrew`
- 项目类型：LayaAir3 + TypeScript 打地鼠游戏原型
- 当前核心目标：用 `bitecs` 承载游戏状态和规则，用 dirty binding 将 ECS 数据差量同步到 Laya 节点。
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

新增 ECS 字段并显示到画面时，通常需要同步修改：

1. `src/ecs/components/index.ts`
2. `src/ecs/world.ts`
3. 对应 `src/ecs/systems/*.ts`
4. `src/binding/DirtyFlags.ts`
5. dirty mark 或系统内手动 dirty 标记
6. 对应 `src/binding/*ViewBinding.ts`
7. 对应 `src/view/*Node.ts`
8. 对应 `src/tests/**/*.test.ts`

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
- 最近基线：111 项测试中 107 项通过、4 项失败。
- 已知失败集中在：
  - `src/tests/ecs/components.test.ts`：洞位 `posYRatio` 期望与当前 `HolePositions` 配置不一致。
  - `src/tests/ecs/HitDetectionSystem.test.ts`：命中测试点击坐标仍按旧洞位 Y 坐标。
  - `src/tests/resource/PlistConverter.test.ts`：rotated 帧宽高期望与当前转换结果不一致。

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

`bin/js/game.js` 典型生成命令：

```bash
npx esbuild src/Main.ts --bundle --format=iife --global-name=Game --platform=browser --target=es6 --external:Laya --outfile=bin/js/game.js
```

这类浏览器运行 bundle 是生成物，不提交。`bin/js/libs/*.js` 是 Laya 运行库，不能因为 `game.js` 是生成物就粗暴忽略整个 `bin/js/`。

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
- 下水道场景有特殊 zOrder/遮罩结构，不要只看草地场景推断所有地图。

## 当前优先级建议

如果重新开始会话后要继续提升项目质量，建议优先处理：

1. 修复当前 4 个基线测试失败，恢复 `npm test` 全绿。
2. 补齐 Player/Hammer/Scene/Hole 等组件的 dirty 标记策略。
3. 完善 `GameScene.stop()` 生命周期清理：timer、stage event、binding 注册表、节点、音效。
4. 统一 `ShrewStateSystem` 的固定 `1/60` timer 与真实 `deltaSec`。
5. 梳理真实 socket 接入点，保留 `KickSocket` 的 seqId/pending 机制。
