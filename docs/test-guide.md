# 测试、调试与提交指南

本文说明本项目的 TDD、测试命令、调试构建和提交规范。动代码前后不知道该跑什么时读这里。

## 默认 TDD 流程

1. 理解需求和现有代码。
2. 有相关测试时，先跑相关测试确认基线。
3. 没有相关测试时，尽量补最小相关测试。
4. 实现最小改动。
5. 跑相关测试。
6. 风险较大时跑更大范围测试。
7. 测试通过后提交 git commit。

文档、`.gitignore`、说明文件等没有可执行相关测试时，不强行补无意义测试。提交信息写：

```text
TDD Red: 文档/配置变更，无对应自动化测试
```

## 常用测试命令

全量测试：

```bash
npm test
```

类型检查：

```bash
npx tsc --noEmit
```

地鼠状态机：

```bash
npm test -- --run src/tests/ecs/ShrewStateSystem.test.ts
```

dirty 标记和 binding：

```bash
npm test -- --run src/tests/ecs/DirtyMarkSystem.test.ts src/tests/sync src/tests/binding
```

输入点击：

```bash
npm test -- --run src/tests/view/KickInputAdapter.test.ts
```

网络：

```bash
npm test -- --run src/tests/network
```

资源转换：

```bash
npm test -- --run src/tests/resource/PlistConverter.test.ts
```

性能压测英雄：

```bash
npm test -- --run src/tests/ecs/PerfHeroSystem.test.ts src/tests/sync/FeatureViewSync.test.ts src/tests/view/PerfHeroNode.test.ts
```

MonsterFeature / Rhino 怪物：

```bash
npm test -- --run src/tests/config/MonsterConfig.test.ts src/tests/ecs/gameplay/monster/MonsterSystem.test.ts src/tests/sync/FeatureViewSync.test.ts src/tests/features/GameFeatureRegistry.test.ts
```

world、Feature 和场景生命周期：

```bash
npm test -- --run src/tests/ecs/WorldFactory.test.ts src/tests/features src/tests/view/GameScene.test.ts
```

当前测试覆盖重点：

- world factory 的组件组合和业务默认值。
- 地鼠状态机。
- 命中检测、锤子阈值、回包状态应用。
- dirty mark、ViewSyncModule 元数据和 Core/HUD/Feature 投影。
- 单 world 进入/退出、Feature 实际 mount 数量和 runtime 清理。
- 场景循环时地鼠、洞位坐标、层级和 full-sync 更新。
- Rhino 的金币里程碑触发、同屏满员时丢弃该次触发、10 秒隐藏和 view sync。
- network protobuf 边界、seqId、乱序、超时、close 取消 pending。
- plist 转 atlas。
- 输入 adapter 的命中、冷却和网络失败路径。

测试优先验证项目行为和边界，不重复验证 bitecs、TypeScript 等依赖本身的基础能力，也不为接口字段“存在”这类编译期事实增加运行时断言。

## 调试构建

生产构建：

```bash
npx esbuild src/Main.ts --bundle --format=iife --global-name=Game --platform=browser --target=es6 --external:Laya --outfile=bin/js/game.js
```

tsc 调试构建：

```bash
npm run build:debug
```

等价于：

```bash
npx tsc -p tsconfig.debug.json
node scripts/fix-esm-extensions.js
node scripts/copy-vendor.js
```

调试页面：

```text
http://localhost:8080/debug-tsc.html
```

自动化准备：

```bash
npm run debug:ready
```

这个命令会先构建 debug 输出，再检查或启动 `bin/` 下的 HTTP 服务。日志写到 `bin/js/debug/http-server.log`，属于生成物，不提交。
调试服务固定绑定 `0.0.0.0:8080`，本机和局域网设备共用同一个端口。

VS Code 推荐：

1. 按 `F5`。
2. 选择 `tsc Debug`。
3. 通过 sourceMap 直接在 TS 源码断点。

## 什么时候跑 debug:ready

改动影响以下内容时，完成测试后继续跑：

- 运行时装配。
- 画面表现。
- 资源加载。
- 输入流程。
- 生命周期。
- 网络或调试链路。

纯 ECS 规则且已有单测覆盖时，可以先不跑浏览器调试，但最终交付时要说明未跑原因。

## CodeGraph 检查

代码结构、调用链、bug 或“怎么工作”类问题优先用 codegraph。正常情况下可以直接调用 MCP 工具；如果工具返回 `Transport closed`，按下面顺序判断：

```bash
codegraph status .
codegraph sync .
tail -30 .codegraph/daemon.log
```

健康状态应看到：

- `Index is up to date`
- `.codegraph/daemon.log` 里有 `Listening on .../.codegraph/daemon.sock`
- `File watcher active`

如果 CLI 正常但 Codex 的 `mcp__codegraph.*` 仍是 `Transport closed`，通常坏的是 Codex 托管的 stdio MCP 连接，不是项目索引。此时：

- 不要删除 `.codegraph/`。
- 可以临时用 `codegraph context "<task>" --path .` 辅助排查。
- 重启当前 Codex 会话或 Codex App，让它重新按 `~/.codex/config.toml` 的 `codegraph serve --mcp` 拉起 MCP。
- 重启后用一次 `codegraph_context` 验证，不要只看 CLI status。

## 本机网络和 npm 代理排查

另一台电脑安装依赖或工具时，如果看到类似错误：

```text
request to https://registry.npmmirror.com/... failed
connect ECONNREFUSED 127.0.0.1:7890
```

含义很直接：npm 或当前终端配置了本地代理 `127.0.0.1:7890`，但这个端口没有代理程序在监听。不要先怀疑包本身，先查本机代理。

检查 npm 和终端代理：

```bash
npm config get proxy
npm config get https-proxy
npm config get registry
echo $HTTP_PROXY
echo $HTTPS_PROXY
echo $ALL_PROXY
lsof -nP -iTCP:7890 -sTCP:LISTEN
```

如果不需要代理，清掉 npm 和当前终端代理：

```bash
npm config delete proxy
npm config delete https-proxy
unset HTTP_PROXY HTTPS_PROXY ALL_PROXY http_proxy https_proxy all_proxy
npm config set registry https://registry.npmjs.org/
```

如果需要用自由猫这类本地代理，先确认代理软件已连接，并且 HTTP/Mixed 端口就是 `7890`：

```bash
lsof -nP -iTCP:7890 -sTCP:LISTEN
curl -x http://127.0.0.1:7890 -I https://registry.npmjs.org/
```

npm 应配置 HTTP 代理端口，不要误填 SOCKS 端口：

```bash
npm config set proxy http://127.0.0.1:7890
npm config set https-proxy http://127.0.0.1:7890
npm config set registry https://registry.npmjs.org/
```

如果浏览器能访问但终端失败，通常是终端没有继承系统代理；如果终端能访问但桌面应用失败，通常是桌面应用没有走终端环境变量，需要开启代理软件的系统代理或 TUN 模式。`NO_PROXY` 建议保留本地回调地址：

```bash
export NO_PROXY=localhost,127.0.0.1,::1
```

## Git 规范

默认每次有效改动都提交。提交信息格式：

```text
<type>: <简短描述>

TDD Red: <先跑了什么测试，失败/基线是什么；没有测试时说明原因>

TDD Green: <做了什么让目标通过，或文档/配置完成了什么>

TDD Refactor: <是否有重构；没有就写“无”>
```

常用 type：

- `feat`
- `fix`
- `test`
- `docs`
- `refactor`
- `chore`

常用命令：

```bash
git status --short
git diff
git diff --cached
git add <file>
git commit -m "<type>: <描述>" -m "TDD Red: ..." -m "TDD Green: ..." -m "TDD Refactor: ..."
git log --oneline --decorate -5
git show --stat --oneline HEAD
```

禁止在未明确要求时使用：

```bash
git reset --hard
git checkout -- <file>
```

工作区可能有用户未提交改动。只处理本任务相关文件，不还原不属于自己的改动。

## 生成物和忽略

默认不要提交：

- `node_modules/`
- `.codegraph/`
- `library/`
- `local/`
- `temp/`
- `release/`
- `.DS_Store`
- 未跟踪的 LayaIDE `*.meta`
- `bin/js/bundles/`
- `bin/js/game.js`
- `bin/js/game.js.map`
- `bin/js/debug/`

`bin/js/libs/*.js` 是 Laya 运行库，不要因为 `game.js` 是生成物就粗暴忽略整个 `bin/js/`。
已有历史跟踪的 `.meta` 不要批量删除；新生成的 `.meta` 默认由 `.gitignore` 忽略。确实需要提交 LayaIDE 管理的新增资源元数据时，用 `git add -f path/to/file.meta` 单独处理。

## 性能压测和局域网发布

详细方法见 `docs/performance-tuning.md`。

压测构建：

```bash
npm run build:debug
```

本机调试：

```text
http://localhost:8080/debug-tsc.html?perf=1&heroes=200
```

局域网验证同样使用 `npm run debug:ready`，不要另开 8081。该命令会重新构建 debug 输出，并确保服务监听所有网卡的 8080。

确认端口监听和页面可访问：

```bash
lsof -nP -iTCP:8080 -sTCP:LISTEN
curl -I 'http://127.0.0.1:8080/debug-tsc.html?perf=1&heroes=200'
```

`lsof` 里健康监听通常是 `*:8080` 或 `0.0.0.0:8080`。如果只有 `127.0.0.1:8080`，局域网设备访问不到；停掉旧服务后重跑 `npm run debug:ready`。本机和局域网始终共用 8080，不要再开 8081。

不要提交 `bin/js/debug/` 生成物。局域网设备看不到最新变化时，先确认是否重新 `npm run build:debug`，再强刷浏览器缓存。

## 排查测试失败

- 不要只改测试让它变绿。
- 先判断代码行为、Laya 运行时资源格式、测试期望哪个是正确事实。
- 资源和坐标迁移相关测试尤其要对齐实际 atlas/plist 格式。
- 复杂 system 要优先通过测试重放输入和输出。

## HitTrace 排查要点

- `socket.response matched=false` 优先查 `Envelope.seq_id` 是否回传一致，再查 pending 超时。
- `score.applied` 出现说明服务端回包和分数应用已成功，画面无变化应转查 binding/view。
- `binding.dizzyAnimation` 出现但肉眼无动画，说明 ECS 状态已到 Dizzy，优先查 `ShrewNode.setAnimation` 的可见表现和 tween 清理。
- 第一击后连续 `hit.miss` 时先看 payload 里的 `hitTable`；`hitTable=0` 是锤子冷却/锁定，不是坐标 miss。冷却中的点击应记录为 `hit.blocked`。
- 肉眼命中但真正 `hit.miss` 且 `hitTable=1` 时，才进入洞位坐标、stage 到游戏容器坐标、当前地图 `HolePositions` 的排查。
