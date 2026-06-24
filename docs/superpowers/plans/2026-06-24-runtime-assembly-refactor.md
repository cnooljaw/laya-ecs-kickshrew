# Runtime Assembly Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the explicit game-loop pipeline while moving view registration, initial synchronization, dirty channel preparation, and resource ownership into initialization-time framework APIs.

**Architecture:** `GameFeature` remains a plain declarative object. `GameScene.init()` compiles feature view-sync definitions into one runtime-scoped registry/channel set, then exposes `mount()` and `own()` to feature setup. Runtime updates keep the fixed `state systems -> network -> feature systems -> dirty mark -> view sync` order and operate on precomputed arrays.

**Tech Stack:** TypeScript, LayaAir3, bitecs 0.3.x, Vitest.

---

### Task 1: Correct Dirty Storage Types

**Files:**
- Modify: `src/ecs/components/index.ts`
- Modify: `src/tests/ecs/components.test.ts`

- [ ] Add assertions that dirty masks are backed by `Uint32Array` and `forceFullSync` by `Uint8Array`.
- [ ] Run `npm test -- --run src/tests/ecs/components.test.ts` and confirm the new assertions fail.
- [ ] Change dirty mask fields to `Types.ui32` and `forceFullSync` to `Types.ui8`.
- [ ] Re-run the focused test and confirm it passes.

### Task 2: Compile Dirty Runtime Data at Initialization

**Files:**
- Modify: `src/sync/dirty/DirtySchemaTypes.ts`
- Modify: `src/sync/dirty/ViewSyncDirtyAspect.ts`
- Modify: `src/sync/dirty/DirtySchemaRunner.ts`
- Modify: `src/sync/dirty/DirtyMarkSystem.ts`
- Modify: `src/sync/viewSync/ViewSyncModule.ts`
- Modify: `src/binding/SyncView.ts`
- Delete: `src/sync/DirtyTargets.ts`
- Modify tests under `src/tests/ecs`, `src/tests/binding`, and `src/tests/sync`

- [ ] Add tests proving dirty channels carry direct typed-array references and world snapshot state can be explicitly released.
- [ ] Run the focused dirty tests and confirm they fail.
- [ ] Remove `storeKey` and the hand-written snapshot-store shape.
- [ ] Derive snapshot maps and dirty clear targets from registered channels.
- [ ] Add `releaseDirtyWorld(world)` for deterministic world teardown.
- [ ] Run focused dirty and sync tests.

### Task 3: Create Runtime-Scoped View Sync Registries

**Files:**
- Modify: `src/sync/viewSync/ViewSyncModule.ts`
- Modify: `src/binding/ViewSyncBinding.ts`
- Modify: `src/binding/viewSyncs/*ViewSync.ts`
- Modify: `src/features/GameFeatureRegistry.ts`
- Modify: `src/view/ViewRegistry.ts`
- Modify tests under `src/tests/binding`, `src/tests/features`, and `src/tests/view`

- [ ] Add tests proving two compiled view runtimes can register the same eid without collision.
- [ ] Add tests proving shared shrew component/animation modules use one node registry.
- [ ] Run tests and confirm they fail with module-global registries.
- [ ] Compile static `ViewSyncModule` descriptions into runtime channels and runtime-scoped registries.
- [ ] Replace concrete registry methods with generic `mount()` and `own()`.
- [ ] Run all binding, feature-registry, and view-registry tests.

### Task 4: Simplify Feature Setup

**Files:**
- Modify: `src/features/GameFeature.ts`
- Modify: `src/features/CoreGameplayFeature.ts`
- Modify: `src/features/HammerFeature.ts`
- Modify: `src/features/HudFeature.ts`
- Modify: `src/features/MonsterFeature.ts`
- Modify: `src/features/PerfHeroFeature.ts`
- Modify: `src/view/GameScene.ts`

- [ ] Add tests for `mount()` initial full sync and owned-resource destruction.
- [ ] Remove `runtimeRefs`, `forceFullSyncEntities`, and direct `ViewRegistry` access from feature context.
- [ ] Migrate every feature to `ctx.mount(sync, eid, node)` and `ctx.own(resource)`.
- [ ] Ensure `GameScene.destroy()` releases the complete runtime and world-specific dirty state.
- [ ] Run feature, registry, and lifecycle tests.

### Task 5: Move Hammer Feedback Through ECS Binding

**Files:**
- Modify: `src/ecs/components/index.ts`
- Modify: `src/ecs/world.ts`
- Modify: `src/sync/DirtyFlags.ts`
- Modify: `src/sync/contracts/HammerViewContract.ts`
- Modify: `src/sync/viewSync/specs/HammerViewSyncSpec.ts`
- Modify: `src/view/KickInputAdapter.ts`
- Modify tests under `src/tests/view`, `src/tests/binding`, and `src/tests/ecs`

- [ ] Add tests that a touch writes hammer position/hit sequence into ECS without requiring a HammerNode.
- [ ] Add binding tests that a hit-sequence change calls `followTouch()` and `playHitAnimation()`.
- [ ] Run tests and confirm failure.
- [ ] Add hammer touch position and hit sequence fields.
- [ ] Move request construction to a pure helper and remove `getHammerNode` from input dependencies.
- [ ] Run focused input and hammer binding tests.

### Task 6: Lifecycle Documentation and Full Verification

**Files:**
- Modify: `docs/architecture.md`
- Modify: `docs/ecs-binding.md`
- Modify: `docs/laya-rules.md`
- Modify: `docs/test-guide.md`

- [ ] Document the one-world runtime ownership model and initialization compilation.
- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm test`.
- [ ] Run `npm run debug:ready`.
- [ ] Inspect `git diff`, stage only related files, and commit using the project TDD template.
