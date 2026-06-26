---
name: test-workflow
description: Use when adding tests, choosing verification commands, running debug builds, or preparing commits in this project.
---

# Test Workflow

## 先读

- `AGENTS.md`
- `docs/test-guide.md`

## 工作流

1. 编辑前看 `git status --short`。
2. 有窄测试时先跑基线。
3. 行为变化先补或更新聚焦测试。
4. 写最小实现。
5. 跑窄测试，再跑 `npx tsc --noEmit`。
6. 触及共享系统或多个边界时跑 `npm test`。
7. 触及运行时、画面、输入、资源、生命周期、网络或 debug 时跑 `npm run debug:ready`。
8. 只暂存本次改动文件；commit 描述尽量用中文。

## 调试

- `npm run debug:ready` 是唯一 local/LAN debug 入口，固定端口 `8080`，不要新增 8081。
- LAN 访问失败时查 `lsof -nP -iTCP:8080 -sTCP:LISTEN`。期望监听 `*:8080` 或 `0.0.0.0:8080`。
- codegraph MCP 返回 `Transport closed` 时，先查 `codegraph status .`、`codegraph sync .` 和 `.codegraph/daemon.log`。

## Commit 模板

```text
<type>: <中文简述>

TDD Red: <先跑了什么测试，失败/基线是什么；没有测试时说明原因>

TDD Green: <做了什么让目标通过，或文档/配置完成了什么>

TDD Refactor: <是否有重构；没有就写“无”>
```

## 安全

- 不使用 `git reset --hard` 或 `git checkout -- <file>`，除非用户明确要求。
- 不回滚无关用户改动。
- 不提交 `bin/js/debug/`、`bin/js/game.js`、`node_modules/` 等生成物。
