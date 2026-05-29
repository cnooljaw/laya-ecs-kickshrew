---
name: test-workflow
description: Use when adding tests, choosing verification commands, running debug builds, or preparing commits in this project.
---

# Test Workflow

Use this project skill for verification and commits.

## Read First

- `AGENTS.md`
- `docs/test-guide.md`

## Workflow

1. Check `git status --short` before edits.
2. Run the smallest relevant test to establish the baseline when one exists.
3. Add or update focused tests for behavior changes.
4. Implement the minimal change.
5. Run narrow tests, then `npx tsc --noEmit`.
6. Run `npm test` when the change touches shared systems or multiple boundaries.
7. Run `npm run debug:ready` when the change affects runtime visuals, input, resources, lifecycle, network, or debugging.
8. Stage only related files and commit with TDD notes.

## Commit Template

```text
<type>: <简短描述>

TDD Red: <先跑了什么测试，失败/基线是什么；没有测试时说明原因>

TDD Green: <做了什么让目标通过，或文档/配置完成了什么>

TDD Refactor: <是否有重构；没有就写“无”>
```

## Safety

- Do not use `git reset --hard` or `git checkout -- <file>` unless explicitly requested.
- Do not revert unrelated user changes.
- Do not commit generated outputs such as `bin/js/debug/`, `bin/js/game.js`, or `node_modules/`.
