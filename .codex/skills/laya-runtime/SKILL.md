---
name: laya-runtime
description: Use when changing Laya view nodes, resource loading, scene switching, timers, tweens, input handling, lifecycle cleanup, or visual runtime behavior in this project.
---

# Laya Runtime Workflow

Use this project skill for changes that touch Laya presentation or runtime ownership.

## Read First

- `AGENTS.md`
- `docs/laya-rules.md`
- `docs/architecture.md` when lifecycle or ownership changes

## Workflow

1. Locate the owner:
   - `Main` for frameLoop and stage events
   - `GameScene` for runtime assembly
   - `Feature` for creating/registering this domain's nodes during setup
   - `ViewRegistry` for node/resource ownership and destroy
   - view node for local children, tweens, timers, and async load guards
2. Keep rules out of view nodes. Convert input to adapter calls or ECS/system updates.
3. Implement view contract methods in `view/*Node.ts`; do not make nodes inspect ECS components or ProjectionRuntime internals directly.
4. Move new visual tuning numbers into `src/config/ViewLayoutConfig.ts` unless they are resource data.
5. Guard async loader callbacks against destroyed nodes or stale scene state.
6. Clear timers/tweens/events using the same owner that registered them.
7. For runtime-visible changes, run related tests and then `npm run debug:ready` when practical.

## Runtime Debug Notes

- Input logs with `hitTable=0` mean hammer cooldown/lock, not hole coordinate miss. Keep this distinct in logs (`hit.blocked` vs `hit.miss`).
- If the Shrew projection logs Dizzy but the player cannot see it, fix `ShrewNode.setAnimation` and clear tweens on state exit/destroy.
- Floating UI or hit effects must set an explicit zOrder above hole/cover layers; adding later is not enough across scene rebuilds.
- For long-run memory growth, compare `JS Heap Used`, `Peak`, `Sprite2DCount`, `GPUMemory`, `AllTexture`, and `GPUBuffer`. `Peak` is monotonic by design; stable sprite count with growing GPU memory points to resource/node destruction, not ECS entity growth.
- Laya `removeChildren()` only removes by default. When rebuilding owned child sprites, pass `removeChildren(0, -1, true)` or explicitly destroy old children.

## Common Test Commands

```bash
npm test -- --run src/tests/view/KickInputAdapter.test.ts
npm test -- --run src/tests/view/ViewRegistry.test.ts
npm test -- --run src/tests/view/ShrewNode.test.ts
npx tsc --noEmit
npm run debug:ready
```

## Review Checklist

- No Laya object becomes the authoritative game state.
- View nodes are reached through `I*Node` contracts and `ViewRegistry`, not direct string reflection or ECS lookups.
- Repeated `destroy()` or scene switch does not retain dead nodes.
- Rebuild paths destroy old owned children instead of only detaching them.
- Async load callbacks are idempotent.
- Resource path changes match `src/resource/AtlasConfig.ts`.
- Cocos Y-up to Laya Y-down conversions remain documented near the code.
