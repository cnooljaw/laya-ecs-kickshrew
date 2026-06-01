---
name: hole-position-tuning
description: Use when tuning KickShrew HolePositions, hole center markers, ShrewNode stand/up alignment, cover zOrder, or visual debug pages for Meadow, Ship, Space, or other maps.
---

# Hole Position Tuning

Use this skill for visual tuning of `src/config/HolePositions.ts` and related shrew/hole preview pages.

## Goal

`HolePositions` are the visual anchor points for shrews. In `Stand`, the shrew body center must sit on the red marker. In `Up` and `Down`, the shrew moves vertically from/to that same anchor while `ShrewNode` clipping prevents lower body leakage through transparent holes.

## Workflow

1. Read `AGENTS.md`, `docs/laya-rules.md`, `src/config/HolePositions.ts`, `src/view/HoleNode.ts`, `src/view/ShrewNode.ts`, and the active debug preview under `src/debug/`.
2. Use `Stand` pages for hole center tuning. Treat the red marker as the desired shrew body center. Use `Up` pages only for clipping and hidden-offset checks.
3. Keep zOrder relationships unchanged unless the visual layer contract is wrong:
   - row0 shrew/hole zOrder `2`, cover zOrder `3`
   - row1 shrew/hole zOrder `4`, cover zOrder `5`
   - row2 shrew/hole zOrder `6`, cover zOrder `7`
4. Adjust only the target map's `xRatios` and `yRatios` when the problem is hole center placement.
5. Prefer small ratio deltas. In a `960x640` viewport:
   - `0.0010` xRatio is about `0.96px`
   - `0.0010` yRatio is about `0.64px`
6. Preserve the tuned Meadow values unless the user explicitly asks to reopen Meadow tuning.
7. After edits, run:
   - `npx tsc --noEmit`
   - `npm run debug:ready`
8. Do not commit visual tuning iterations unless the user asks. Show the exact debug URLs for screenshot review.

## Debug Page Expectations

Stand preview pages should show:

- scene background and covers
- all 9 shrews in `Stand`
- red cross markers at `HolePositions`
- labels containing hole id, row/column, and shrew zOrder

Up-start preview pages should additionally show cover debug rectangles with cover id, zOrder, top y, and bottom y.

## Tuning Heuristics

- If the red point is right of the visual shrew center, decrease xRatio. If it is left, increase xRatio.
- If the red point is below the visual shrew center, decrease yRatio. If it is above, increase yRatio.
- Tune by rows first, then per-column x offsets.
- For Ship and Space, start from existing Lua-derived ratios and correct against the rendered Laya background, not against Meadow values.
