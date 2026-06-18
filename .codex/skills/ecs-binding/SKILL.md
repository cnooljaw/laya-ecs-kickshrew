---
name: ecs-binding
description: Use when changing ECS components, systems, DirtyFlags, DirtyAspect mappings, DirtyMarkSystem, SyncView, binding projections, or view synchronization in this project.
---

# ECS Binding Workflow

Use this project skill for changes that affect authoritative ECS state or how it reaches Laya nodes.

## Read First

- `AGENTS.md`
- `docs/ecs-binding.md`
- `docs/architecture.md` when the change crosses module boundaries

## Workflow

1. Identify the authoritative component field and the system/helper that owns writes to it.
2. Check whether the field must be visible in Laya.
3. If visible, update the full chain:
   - `src/ecs/components/index.ts`
   - `src/ecs/world.ts`
   - relevant `src/ecs/systems/*.ts` or helper
   - `src/sync/DirtyFlags.ts`
   - `src/sync/rules/*ViewRules.ts`
   - relevant `src/ecs/dirty/aspects/*DirtyAspect.ts`
   - relevant `src/binding/*ViewBinding.ts`
   - relevant `src/view/*Node.ts`
   - tests under `src/tests/**`
4. Keep ECS logic free of `Laya.*`.
5. Prefer pure helpers for reusable state reset or transition logic.
6. Verify with the narrowest related test first, then broaden if the change touches shared behavior.

## Common Test Commands

```bash
npm test -- --run src/tests/ecs/DirtyMarkSystem.test.ts
npm test -- --run src/tests/binding/ShrewViewBinding.test.ts
npm test -- --run src/tests/ecs/ShrewStateSystem.test.ts
npx tsc --noEmit
```

## Review Checklist

- Component is the authority; view node is not.
- Dirty bit, DirtyAspect mark, binding, and node method names align.
- `forceFullSync` is not hiding normal dirty propagation gaps.
- State transitions are covered by tests where practical.
- System ordering is still explicit and documented when changed.
