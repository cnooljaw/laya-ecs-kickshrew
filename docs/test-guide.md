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
npm test -- --run src/tests/ecs/DirtyMarkSystem.test.ts src/tests/binding/ShrewViewBinding.test.ts
```

输入点击：

```bash
npm test -- --run src/tests/view/KickInputAdapter.test.ts
```

网络：

```bash
npm test -- --run src/tests/network/KickProtoCodec.test.ts src/tests/network/KickSocket.test.ts src/tests/network/MockServer.test.ts
```

资源转换：

```bash
npm test -- --run src/tests/resource/PlistConverter.test.ts
```

当前测试覆盖重点：

- ECS components/world。
- 地鼠状态机。
- 命中检测、连击、锤子、回包。
- dirty mark 和 binding。
- network seqId、乱序、超时。
- plist 转 atlas。
- 输入 adapter 和 view registry。

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
- `bin/js/bundles/`
- `bin/js/game.js`
- `bin/js/game.js.map`
- `bin/js/debug/`

`bin/js/libs/*.js` 是 Laya 运行库，不要因为 `game.js` 是生成物就粗暴忽略整个 `bin/js/`。

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
