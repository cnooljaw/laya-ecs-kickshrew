---
name: ecs-binding
description: Use when changing ECS components, systems, DirtyFlags, ViewSyncModule mappings, DirtyMarkSystem, SyncView, binding projections, or view synchronization in this project.
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
3. If visible, start from the `ViewSyncSpec` row and update the full chain:
   - `src/ecs/components/index.ts`
   - `src/ecs/world.ts`
   - relevant `src/ecs/gameplay/<domain>/*.ts` or helper
   - `src/sync/DirtyFlags.ts`
   - `src/sync/contracts/*ViewContract.ts`
   - `src/sync/viewSync/specs/*ViewSyncSpec.ts`
   - relevant `src/binding/*ViewBinding.ts`
   - relevant `src/binding/viewSyncs/*ViewSync.ts`
   - relevant `src/view/*Node.ts`
   - tests under `src/tests/**`
4. Keep ECS logic free of `Laya.*`.
5. Keep `ViewSyncSpec` free of concrete Laya nodes, loaders, tweens, timers, and resource lifecycle code. It may read ECS components and call `I*Node` contracts.
6. For new independent gameplay, keep Feature thin: ECS state/systems/factory in `src/ecs/gameplay/<domain>`, config in `src/config`, sync spec in `src/sync/viewSync/specs`, projection in `src/binding`, Laya implementation in `src/view`, and Feature only for setup/systems/viewSyncs registration.
7. Prefer pure helpers for reusable state reset or transition logic.
8. Verify with the narrowest related test first, then broaden if the change touches shared behavior.

## Mental Model

```text
System changes Component
  -> ViewSyncSpec.fields opens dirty bit
  -> DirtyMarkSystem writes DirtyComponent.xxxDirty
  -> SyncView finds ViewSyncChannel
  -> ViewSyncBinding executes spec.apply
  -> I*Node contract
  -> view/*Node.ts Laya implementation
```

`ViewSyncSpec` has two meanings in one table: dirty rule (`fields -> bit`) and view projection rule (`bit -> apply`). Prefer local `createSyncRow<IContract, Field>()` helpers so rows stay readable.

## Common Test Commands

```bash
npm test -- --run src/tests/ecs/DirtyMarkSystem.test.ts
npm test -- --run src/tests/binding/ShrewViewBinding.test.ts
npm test -- --run src/tests/ecs/ShrewStateSystem.test.ts
npx tsc --noEmit
```

## Review Checklist

- Component is the authority; view node is not.
- Dirty bit, ViewSyncSpec row, ViewSyncModule channel, binding, and node method names align.
- `bitsOf(spec)` covers the intended dirty bits; do not reintroduce hand-written all-bits constants.
- `forceFullSync` is not hiding normal dirty propagation gaps.
- Feature only wires this domain into the game; it does not become a new rule container.
- State transitions are covered by tests where practical.
- System ordering is still explicit and documented when changed.
