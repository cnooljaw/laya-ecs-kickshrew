# Frame Ingress Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make network state changes enter the ECS world at a deterministic frame boundary, make system order explicit, and separate Hammer response writes from derived thunder activation.

**Architecture:** `NetworkAdapter` remains transport-only. `GameScene` owns a per-scene typed `GameIngressQueue`; callbacks enqueue protocol facts and the `ingress` phase drains them before simulation. Feature systems use explicit `state`, `gameplay`, and post-gameplay `derived` phases; Projection and Effect remain runtime-owned frame-end steps. A narrow structural-rebuild callback is accepted by the pipeline but is not wired to a new dirty mechanism.

**Tech Stack:** TypeScript, bitecs, Vitest, LayaAir runtime shell.

---

### Task 1: Define explicit frame phases

**Files:**
- Modify: `src/framework/feature/FeatureManifest.ts`
- Modify: `src/framework/feature/FeatureRegistry.ts`
- Modify: `src/app/GameLoopPipeline.ts`
- Modify: `src/tests/view/GameLoopPipeline.test.ts`

- [ ] **Step 1: Write the failing pipeline-order test**

Replace the two-phase test runtime with phase-specific systems and assert this order:

```ts
expect(order).toEqual([
  "network", "ingress", "state", "gameplay", "derived",
  "projectionMark", "projectionSync", "effects",
]);
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- --run src/tests/view/GameLoopPipeline.test.ts`

Expected: FAIL because `systemsByPhase("ingress")` is not accepted and the old order is still asserted.

- [ ] **Step 3: Add the minimal phase model**

Define these phases in `FeatureManifest.ts`:

```ts
export type GameSystemPhase = "ingress" | "state" | "gameplay" | "derived";
export const GAME_SYSTEM_PHASES = ["ingress", "state", "gameplay", "derived"] as const;
```

Make `GameFeatureRuntime.systemsByPhase` return the registered systems for the requested phase. In `GameLoopPipeline.update`, call `network.update()` first, then run the four phase arrays in `GAME_SYSTEM_PHASES` order before projection and effects.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `npm test -- --run src/tests/view/GameLoopPipeline.test.ts`

Expected: PASS with the explicit frame order.

### Task 2: Introduce a typed per-scene network ingress queue

**Files:**
- Create: `src/game/session/GameIngressQueue.ts`
- Modify: `src/game/session/SessionSystems.ts`
- Modify: `src/game/session/index.ts`
- Modify: `src/app/GameScene.ts`
- Create: `src/tests/game/session/GameIngressQueue.test.ts`

- [ ] **Step 1: Write failing queue tests**

Create tests that enqueue a kick response, snapshot, shrew timeline, shrew state, map state, and time-sync response; drain them into a real world and assert FIFO application. Add a second test that calls `clear()` before draining and asserts no handler is run.

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- --run src/tests/game/session/GameIngressQueue.test.ts`

Expected: FAIL because `GameIngressQueue` does not exist.

- [ ] **Step 3: Implement the queue and ingress system**

Create a discriminated union of the six protocol facts. `GameIngressQueue.enqueue` appends one fact, `drain(world, effects)` processes the current array in FIFO order, and `clear()` removes pending facts. Reuse current session and server-sync appliers; time-sync updates the server clock when drained.

Expose `createGameIngressQueue` and register its drain function as `defineSystem("ingress", "session.networkIngress", ...)` from `GameScene` via the registry's extra systems. Change all `NetworkAdapter` callbacks in `GameScene.init` to enqueue instead of mutating the world.

- [ ] **Step 4: Run focused tests and verify they pass**

Run: `npm test -- --run src/tests/game/session/GameIngressQueue.test.ts src/tests/game/session/KickResponseHandler.test.ts src/tests/view/GameScene.test.ts`

Expected: PASS; a successful response is applied only by the ingress drain, while destroy clears any unconsumed facts.

### Task 3: Split Hammer commands, ticking, and derived activation

**Files:**
- Modify: `src/game/features/hammer/HammerSystems.ts`
- Modify: `src/game/features/hammer/HammerFeature.ts`
- Modify: `src/game/session/HammerThunderSystem.ts`
- Modify: `src/game/session/KickResponseHandler.ts`
- Modify: `src/game/session/SessionSystems.ts`
- Modify: `src/tests/game/features/hammer/HammerSystem.test.ts`
- Modify: `src/tests/game/session/KickResponseHandler.test.ts`

- [ ] **Step 1: Write failing behavior tests**

Replace direct multi-purpose `hammerSystem` calls with:

```ts
advanceHammerCooldownSystem(world, 0.24);
completeHammerHitAnimation(hammerEid);
completeHammerThunderAnimation(hammerEid);
```

Change the response-handler test so applying a response at the thunder threshold does **not** immediately activate thunder; call `activateHammerThunderIfCharged(world)` and assert it then activates.

- [ ] **Step 2: Run focused tests and verify they fail**

Run: `npm test -- --run src/tests/game/features/hammer/HammerSystem.test.ts src/tests/game/session/KickResponseHandler.test.ts`

Expected: FAIL because the new APIs are absent and `applyKickResponse` still invokes the derived rule.

- [ ] **Step 3: Implement the minimal separation**

Keep protocol response application in `applyHammerKickResponse`. Replace the scheduled wrapper with `advanceHammerCooldownSystem(world, deltaSec)`. Export explicit completion helpers for animation callbacks. Register cooldown in `state`; register `activateHammerThunderIfCharged` only once in `derived`; remove the direct derived-rule call from `applyKickResponse`.

- [ ] **Step 4: Run focused tests and verify they pass**

Run: `npm test -- --run src/tests/game/features/hammer/HammerSystem.test.ts src/tests/game/session/KickResponseHandler.test.ts`

Expected: PASS; direct response writes remain deterministic and thunder activation has exactly one frame-system owner.

### Task 4: Add a narrow structural-rebuild pipeline seam and document the architecture

**Files:**
- Modify: `src/app/GameLoopPipeline.ts`
- Modify: `src/tests/view/GameLoopPipeline.test.ts`
- Modify: `docs/architecture.md`
- Modify: `docs/test-guide.md`

- [ ] **Step 1: Write the failing rebuild-order test**

Pass `rebuild: () => order.push("rebuild")` to `GameLoopPipeline` and assert it runs after `gameplay` and before projection only when `requestRebuild()` has been called.

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- --run src/tests/view/GameLoopPipeline.test.ts`

Expected: FAIL because the pipeline has no rebuild request API.

- [ ] **Step 3: Implement the one-bit runtime-owned seam**

Add `requestRebuild()` to `GameLoopPipeline`; it sets a private flag. In `update`, consume it once after `derived`. Do not expose it to Features and do not connect it to `ProjectionRuntime`; it is reserved for scene/session-owned topology or resource rebuilds.

Document the complete frame order, ingress ownership, the distinction between structural rebuild and Projection dirty comparison, and required test coverage.

- [ ] **Step 4: Run focused tests and verify they pass**

Run: `npm test -- --run src/tests/view/GameLoopPipeline.test.ts`

Expected: PASS; rebuild is absent from normal frames and appears once after a request.

### Task 5: Validate the cross-boundary refactor

**Files:**
- Verify only

- [ ] **Step 1: Run targeted suites**

Run:

```bash
npm test -- --run src/tests/view/GameLoopPipeline.test.ts src/tests/game/session/GameIngressQueue.test.ts src/tests/game/session/KickResponseHandler.test.ts src/tests/game/features/hammer/HammerSystem.test.ts src/tests/view/GameScene.test.ts
```

Expected: all selected tests pass.

- [ ] **Step 2: Run type and full checks**

Run:

```bash
npx tsc --noEmit
npm test
npm run debug:ready
```

Expected: typecheck and full suite pass; debug build starts its existing service on port 8080.

- [ ] **Step 3: Inspect the diff and commit only task files**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; the three pre-existing deleted plan files remain unstaged.
