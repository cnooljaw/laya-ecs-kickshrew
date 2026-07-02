---
name: hole-position-tuning
description: Use when tuning KickShrew HolePositions, hole center markers, ShrewNode stand/up alignment, cover zOrder, or visual debug pages for Meadow, Ship, Space, or other maps.
---

# Hole Position Tuning

## 目标

`HolePositions` 是 Shrew 的视觉锚点，也是 Monster 三角落点的输入。`Stand` 状态下，Shrew body 中心应落在红色标记点上。Monster 的目标点是三个洞中心的几何中心，再叠加 `MONSTER_VIEW_CONFIG` 的视觉框偏移。`Up` 和 `Down` 从同一个锚点做纵向移动，由 `ShrewNode` 裁剪避免身体下半部分穿出透明洞口。

## 工作流

1. 先读 `AGENTS.md`、`docs/laya-rules.md`、`src/game/features/shrew/HolePositions.ts`、`HoleNode.ts`、`ShrewNode.ts` 和当前 `src/debug/` 预览页。
2. 用 `Stand` 页调洞中心。红色标记点就是目标 body center。
3. 用 `Up` 页检查裁剪和 hidden offset，不用它调中心。
4. 用 `debug-*-monster-drop.html` 调 Monster 三角落点。红线是洞中心连线，红点是 triad center，按钮 `0` 到 `15` 按 `MONSTER_HOLE_TRIADS` 顺序播放 Drop。
5. Monster 最终视觉中心不对时，优先改 `MONSTER_VIEW_CONFIG[MonsterType.Rhino].visualBounds` 或落点偏移，不改 Skeleton anchor，也不直接相信 `skeleton.getBounds()`。
6. 保持 zOrder 关系，除非视觉层级契约本身错了：
   - row0 shrew/hole zOrder `2`，cover zOrder `3`
   - row1 shrew/hole zOrder `4`，cover zOrder `5`
   - row2 shrew/hole zOrder `6`，cover zOrder `7`
7. 洞中心问题只改目标地图的 `xRatios` 和 `yRatios`。
8. 优先小步调整。在 `960x640` 视口中，`0.0010` xRatio 约等于 `0.96px`，`0.0010` yRatio 约等于 `0.64px`。
9. 用户未明确要求时，不重新打开 Meadow 调参。
10. 编辑后跑 `npx tsc --noEmit` 和 `npm run debug:ready`。
11. 视觉调参迭代默认不提交。给用户明确 debug URL 做截图确认。

## 预览页期望

Stand 页应显示：

- 场景背景和 cover。
- 9 个 `Stand` 状态 Shrew。
- `HolePositions` 红色十字标记。
- 包含 hole id、row/column、shrew zOrder 的标签。

Up-start 页还应显示 cover debug rectangle，包含 cover id、zOrder、top y、bottom y。

Monster Drop 页应显示：

- 16 个三洞三角形，红线连接三个洞中心。
- triad index 和三角形中心点。
- Monster 容器锚点、视觉有效框和 raw skeleton bounds。
- `Replay`、`Next` 和 `0` 到 `15` 的单步按钮。

## 调参规则

- 红点在 Shrew 视觉中心右侧：降低 xRatio。
- 红点在 Shrew 视觉中心左侧：提高 xRatio。
- 红点在 Shrew 视觉中心下方：降低 yRatio。
- 红点在 Shrew 视觉中心上方：提高 yRatio。
- 先按行调，再修每列 x offset。
- Ship 和 Space 从 Lua 派生值开始，按 Laya 背景渲染结果修正，不套用 Meadow 值。
