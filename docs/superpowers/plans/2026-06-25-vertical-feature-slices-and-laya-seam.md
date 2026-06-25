# Vertical Feature Slices and Laya Upgrade Seam Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将稳定框架迁移到 `src/framework/**`，将业务迁移到 `src/game/features/**` 纵向切片，并通过少量 Laya 兼容工具集中版本升级影响，使新增普通业务主要只修改自己的目录并在 `GameFeatures.ts` 增加一行注册。

**Architecture:** 保留当前编译式 `EntityRuntime + ProjectionRuntime + EffectRuntime`，不引入 BaseFeature、自动扫描、Presentation provider 或通用 UI DSL。业务切片同时拥有 Component、Entity、System、Projection、ViewContract、Laya Node 和业务配置；只有容易随 Laya 版本变化的全局运行时获取、资源加载、Spine 创建、timer/tween/event 清理和销毁操作进入 `src/framework/view`。跨 Feature 规则进入显式 `src/game/session` 编排层，Feature 之间只通过公开 `index.ts` 依赖。

**Tech Stack:** TypeScript 6、LayaAir3、bitecs 0.3、Vitest、现有 debug-tsc 构建。

---

## Target File Structure

```text
src/
  framework/
    ecs/
      EntityDefinition.ts
      EntityRuntime.ts
    feature/
      FeatureManifest.ts
      FeatureRegistry.ts
      FeatureRuntimeContext.ts
      MountPrimitives.ts
    sync/
      ProjectionDefinition.ts
      ProjectionRuntime.ts
      EffectDefinition.ts
      EffectRuntime.ts
    view/
      ViewRegistry.ts
      LayaRuntime.ts
      LayaLoader.ts
      LayaSpine.ts
      LayaLifecycle.ts

  game/
    GameFeatures.ts
    session/
      KickDetection.ts
      KickInputController.ts
      KickResponseFlow.ts
      ThunderSystem.ts
    features/
      shrew/
        ShrewComponents.ts
        ShrewTypes.ts
        ShrewEntities.ts
        ShrewSystems.ts
        ShrewLifecycle.ts
        ShrewProjection.ts
        ShrewViewContract.ts
        ShrewNode.ts
        HoleNode.ts
        SceneLayer.ts
        ShrewRules.ts
        ShrewViewConfig.ts
        ShrewFeature.ts
        index.ts
      hammer/
      playerHud/
      monster/
      perfHero/

  app/
    Main.ts
    Bootstrap.ts
    GameScene.ts
    GameLoopPipeline.ts

  network/
  resource/
  debug/
```

本轮不移动通用 protobuf/network、atlas 转换和 debug 工具；它们不是 Feature 私有业务，也不属于这次目录目标。

## Dependency Rules

```text
framework -> bitecs / TypeScript only
game/features/* -> framework + own files + game/shared public API
game/session -> framework + feature public index.ts + network contracts
app -> framework + game + network + Laya
concrete feature Node -> framework/view Laya helpers + own contract/config
```

禁止：

```text
framework -> game
feature A -> feature B internal file
domain system -> concrete Node
Feature Manifest -> window.Laya / loader / timer / tween
automatic directory scanning
mountTree generic DSL
```

---

### Task 1: Lock the New Architecture Boundaries

**Files:**
- Modify: `src/tests/architecture/FrameworkBoundary.test.ts`
- Create: `src/tests/architecture/FeatureSliceBoundary.test.ts`
- Create: `src/tests/architecture/ExplicitFeatureRegistration.test.ts`

- [ ] **Step 1: Extend the framework dependency test**

Add a reusable tree reader and assert that future framework files never import game code:

```ts
it("framework never imports game or app code", () => {
  const framework = readTypeScriptTree("src/framework");
  expect(framework).not.toMatch(/from\s+["'][^"']*(?:game|app)\//);
});
```

The test must tolerate `src/framework` not existing yet by returning an empty string when the directory is absent.

- [ ] **Step 2: Add the vertical-slice dependency test**

Create `FeatureSliceBoundary.test.ts`:

```ts
it("features do not import another feature's internal file", () => {
  const violations = findImports("src/game/features")
    .filter(item => item.importPath.includes("/features/"))
    .filter(item => !item.importPath.endsWith("/index"));

  expect(violations).toEqual([]);
});
```

`findImports` must return `{ file, importPath }[]` using a single import regex and recursive directory walk. Imports inside the same feature directory are allowed; only imports crossing into a different feature are violations.

- [ ] **Step 3: Add explicit registration contract**

Create `ExplicitFeatureRegistration.test.ts`:

```ts
it("registers feature manifests explicitly in GameFeatures", () => {
  const source = readFileSync("src/game/GameFeatures.ts", "utf8");
  expect(source).toContain("ShrewFeature");
  expect(source).toContain("HammerFeature");
  expect(source).toContain("PlayerHudFeature");
  expect(source).toContain("MonsterFeature");
  expect(source).toContain("PerfHeroFeature");
  expect(source).not.toMatch(/readdir|glob|import\.meta|require\.context/);
});
```

- [ ] **Step 4: Run the tests to establish Red**

Run:

```bash
npm test -- --run src/tests/architecture
```

Expected: FAIL because `src/framework` and `src/game/GameFeatures.ts` do not exist.

- [ ] **Step 5: Commit the boundary contracts**

```bash
git add src/tests/architecture
git commit -m "test: define vertical feature boundaries"
```

---

### Task 2: Move the Stable Runtime into `src/framework`

**Files:**
- Move: `src/ecs/runtime/EntityType.ts` -> `src/framework/ecs/EntityDefinition.ts`
- Move: `src/ecs/runtime/EntityRuntime.ts` -> `src/framework/ecs/EntityRuntime.ts`
- Move: `src/features/GameFeature.ts` -> `src/framework/feature/FeatureManifest.ts`
- Move: `src/features/GameFeatureRegistry.ts` -> `src/framework/feature/FeatureRegistry.ts`
- Move: `src/features/FeatureRuntimeContext.ts` -> `src/framework/feature/FeatureRuntimeContext.ts`
- Move: `src/sync/projection/ProjectionDefinition.ts` -> `src/framework/sync/ProjectionDefinition.ts`
- Move: `src/sync/projection/ProjectionRuntime.ts` -> `src/framework/sync/ProjectionRuntime.ts`
- Move: `src/effects/EffectDefinition.ts` -> `src/framework/sync/EffectDefinition.ts`
- Move: `src/effects/EffectRuntime.ts` -> `src/framework/sync/EffectRuntime.ts`
- Move: `src/view/ViewRegistry.ts` -> `src/framework/view/ViewRegistry.ts`
- Modify: imports under `src/**`
- Modify: related tests under `src/tests/ecs`, `src/tests/sync`, `src/tests/effects`, `src/tests/features`, `src/tests/view`

- [ ] **Step 1: Add framework public exports**

Create barrel files:

```ts
// src/framework/ecs/index.ts
export * from "./EntityDefinition";
export * from "./EntityRuntime";
```

```ts
// src/framework/sync/index.ts
export * from "./ProjectionDefinition";
export * from "./ProjectionRuntime";
export * from "./EffectDefinition";
export * from "./EffectRuntime";
```

```ts
// src/framework/feature/index.ts
export * from "./FeatureManifest";
export * from "./FeatureRegistry";
export * from "./FeatureRuntimeContext";
```

- [ ] **Step 2: Rename `defineEntityType` to `defineEntity`**

`EntityDefinition.ts` must expose:

```ts
export interface EntityDefinition<TInput = void> {
  readonly name: string;
  readonly components: readonly any[];
  readonly cardinality: "one" | "many";
  readonly initialize: (eid: number, input: TInput) => void;
}

export function defineEntity<TInput = void>(
  definition: EntityDefinition<TInput>,
): EntityDefinition<TInput> {
  return definition;
}
```

Update `EntityRuntime` signatures from `EntityType` to `EntityDefinition`.

- [ ] **Step 3: Move files without changing runtime behavior**

Use `apply_patch` moves. Update imports mechanically. Do not change algorithms in this task.

- [ ] **Step 4: Run framework tests**

```bash
npm test -- --run \
  src/tests/ecs/EntityRuntime.test.ts \
  src/tests/sync/ProjectionDefinition.test.ts \
  src/tests/sync/ProjectionRuntime.test.ts \
  src/tests/effects/EffectRuntime.test.ts \
  src/tests/features/GameFeatureRuntime.test.ts \
  src/tests/view/ViewRegistry.test.ts
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/framework src/tests src
git commit -m "refactor: move stable runtimes into framework"
```

---

### Task 3: Introduce the Small Feature Manifest Primitives

**Files:**
- Modify: `src/framework/feature/FeatureManifest.ts`
- Modify: `src/framework/feature/FeatureRegistry.ts`
- Modify: `src/framework/feature/FeatureRuntimeContext.ts`
- Create: `src/framework/feature/MountPrimitives.ts`
- Modify: `src/tests/features/GameFeatureRegistry.test.ts`
- Modify: `src/tests/features/GameFeatureRuntime.test.ts`

- [ ] **Step 1: Write Red tests for named systems**

```ts
const TickSystem = defineSystem("state", "test.tick", () => {});
const feature = defineFeature({
  name: "test",
  systems: [TickSystem],
});

expect(registry.systemsByPhase("state")).toEqual([
  { name: "test.tick", run: TickSystem.run },
]);
```

Also assert duplicate system names fail independently of JavaScript `Function.name`.

- [ ] **Step 2: Write Red tests for `mountOne` and `mountPool`**

```ts
const one = context.mountOne({
  eid,
  projection: TestProjection,
  create: () => node,
});

const many = context.mountPool({
  eids: [eidA, eidB],
  projection: TestProjection,
  create: (_eid, index) => nodes[index],
});

expect(one).toBe(node);
expect(many).toEqual(nodes);
```

- [ ] **Step 3: Implement `defineSystem` and the new manifest shape**

```ts
export interface SystemDefinition {
  readonly phase: "state" | "feature";
  readonly name: string;
  readonly run: GameSystem;
}

export function defineSystem(
  phase: SystemDefinition["phase"],
  name: string,
  run: GameSystem,
): SystemDefinition {
  return { phase, name, run };
}

export interface FeatureManifest {
  readonly name: string;
  readonly entities?: readonly EntityDefinition<any>[];
  readonly projections?: readonly ProjectionDefinition<any>[];
  readonly systems?: readonly SystemDefinition[];
  readonly setup?: (context: FeatureRuntimeContext) => void;
}

export function defineFeature(feature: FeatureManifest): FeatureManifest {
  return feature;
}
```

Registry compilation must preserve manifest order and group systems by `phase`.

- [ ] **Step 4: Implement mount primitives**

Expose them directly on `FeatureRuntimeContext`:

```ts
interface FeatureRuntimeContext {
  readonly world: any;
  readonly entities: EntityRuntime;
  readonly effects: Pick<EffectRuntime, "on" | "emit">;
  mountOne<TNode extends MountableView>(options: MountOneOptions<TNode>): TNode;
  mountPool<TNode extends MountableView>(options: MountPoolOptions<TNode>): TNode[];
  createView<TNode extends MountableView>(create: () => TNode): TNode;
  own<TResource extends Destroyable>(resource: TResource): TResource;
}
```

Do not add `mountTree`. Tree relationships remain explicit business code.

- [ ] **Step 5: Migrate existing manifests to the new primitives**

Example:

```ts
systems: [
  defineSystem("feature", "monster.lifetime", monsterLifetimeSystem),
  defineSystem("feature", "monster.spawn", monsterSpawnSystem),
],
```

- [ ] **Step 6: Verify**

```bash
npm test -- --run src/tests/features src/tests/view/GameLoopPipeline.test.ts
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/framework/feature src/features src/tests/features src/tests/view/GameLoopPipeline.test.ts
git commit -m "feat: add explicit feature assembly primitives"
```

---

### Task 4: Add a Narrow Laya Upgrade Seam

**Files:**
- Create: `src/framework/view/LayaRuntime.ts`
- Create: `src/framework/view/LayaLoader.ts`
- Create: `src/framework/view/LayaSpine.ts`
- Create: `src/framework/view/LayaLifecycle.ts`
- Create: `src/tests/framework/view/LayaRuntime.test.ts`
- Create: `src/tests/framework/view/LayaLoader.test.ts`
- Create: `src/tests/framework/view/LayaLifecycle.test.ts`

- [ ] **Step 1: Write Red tests for runtime lookup**

```ts
expect(getLaya()).toBeNull();

Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: { Laya: fakeLaya },
});

expect(getLaya()).toBe(fakeLaya);

delete (globalThis as any).window;
```

The implementation must read `globalThis.window?.Laya`; do not cache the runtime globally.

- [ ] **Step 2: Implement `LayaRuntime.ts`**

```ts
export function getLaya(): any | null {
  const runtimeWindow = globalThis.window as any;
  return runtimeWindow?.Laya ?? null;
}
```

- [ ] **Step 3: Write Red tests for loader caching and retry**

Test that two `loadSpineTemplate("a.sk")` calls share one promise, and a rejected load removes the cache entry so the next call retries.

- [ ] **Step 4: Implement loader and Spine helpers**

```ts
export function loadResource<T = any>(url: string, type?: any): Promise<T>;
export function loadSpineTemplate(url: string): Promise<any>;
export function createSkeleton(template: any, armatureIndex = 0): any;
```

`loadResource` delegates to `getLaya().loader.load`. `createSkeleton` contains the `buildArmature` versus `new Laya.Skeleton()` compatibility branch currently duplicated in Nodes.

- [ ] **Step 5: Implement lifecycle helpers**

```ts
export function destroyNode(node: any): void {
  node?.offAll?.();
  node?.destroy?.();
}

export function destroyChildren(owner: any): void {
  owner?.removeChildren?.(0, -1, true);
}

export function clearTweens(target: any): void {
  getLaya()?.Tween?.clearAll?.(target);
}
```

Do not wrap `x`, `y`, `visible`, `zOrder`, `scaleX`, `scaleY` or ordinary `addChild`.

- [ ] **Step 6: Migrate one existing Node as proof**

Change `MonsterNode` to use `getLaya`, `loadSpineTemplate`, `createSkeleton`, and `destroyNode`. Keep its direct layout operations unchanged.

- [ ] **Step 7: Verify**

```bash
npm test -- --run src/tests/framework/view src/tests/view/MonsterNode.test.ts
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/framework/view src/view/MonsterNode.ts src/tests/framework src/tests/view/MonsterNode.test.ts
git commit -m "feat: isolate laya version-sensitive APIs"
```

---

### Task 5: Migrate Monster as the First Complete Vertical Slice

**Files:**
- Create directory: `src/game/features/monster/`
- Move and rename:
  - `src/ecs/gameplay/monster/MonsterComponent.ts` -> `src/game/features/monster/MonsterComponents.ts`
  - `MonsterEntity.ts` -> `MonsterEntities.ts`
  - `MonsterSystem.ts` -> `MonsterSystems.ts`
  - `MonsterFactory.ts` -> `MonsterPool.ts`
  - `MonsterTypes.ts` -> `MonsterTypes.ts`
  - `src/sync/projections/MonsterProjection.ts` -> `MonsterProjection.ts`
  - `src/sync/contracts/MonsterViewContract.ts` -> `MonsterViewContract.ts`
  - `src/view/MonsterNode.ts` -> `MonsterNode.ts`
  - `src/features/MonsterFeature.ts` -> `MonsterFeature.ts`
- Split: `src/config/MonsterConfig.ts`
- Create: `src/game/features/monster/MonsterRules.ts`
- Create: `src/game/features/monster/MonsterViewConfig.ts`
- Create: `src/game/features/monster/index.ts`
- Move tests into `src/tests/game/features/monster/`

- [ ] **Step 1: Write Red import-boundary assertions**

Assert `MonsterSystems.ts` imports `MonsterRules` but not `MonsterViewConfig`, and `MonsterNode.ts` imports `MonsterViewConfig`.

- [ ] **Step 2: Split rule and view configuration**

```ts
// MonsterRules.ts
export const MONSTER_RULES = {
  durationSec: 10,
  spawnRules: [/* existing typed rules */],
} as const;
```

```ts
// MonsterViewConfig.ts
export const MONSTER_VIEW_CONFIG = {
  [MonsterType.Rhino]: {
    skUrl: "resources/monster/rhino.sk",
    pngUrl: "resources/monster/rhino.png",
    scale: 1,
    posX: DESIGN_RESOLUTION.width * 0.5,
    posY: DESIGN_RESOLUTION.height * 0.55,
  },
} as const;
```

Entity initialization may combine rule duration and view spawn defaults, but systems must not import resource URLs.

Keep that combination in `MonsterFeature`, not in `MonsterEntities.ts`:

```ts
const entityInputs = MONSTER_RULES.spawnRules.map(rule => ({
  ...rule,
  durationSec: MONSTER_RULES.durationSec,
  initialX: MONSTER_VIEW_CONFIG[rule.type].posX,
  initialY: MONSTER_VIEW_CONFIG[rule.type].posY,
  initialScale: MONSTER_VIEW_CONFIG[rule.type].scale,
}));

const eids = createMonsterPool(entities, entityInputs);
```

`MonsterEntities.ts` accepts a typed `MonsterEntityInput` and writes ECS data only. It must not import `MonsterViewConfig` or any resource URL.

- [ ] **Step 3: Move the slice files and update local imports**

Use same-directory imports inside the slice. `index.ts` exports only:

```ts
export { MonsterFeature } from "./MonsterFeature";
export { MonsterComponent } from "./MonsterComponents";
export { MonsterType } from "./MonsterTypes";
```

Do not export concrete Node or internal pool helpers unless another approved orchestration module needs them.

- [ ] **Step 4: Convert the manifest to primitives**

```ts
export const MonsterFeature = defineFeature({
  name: "monster",
  entities: [MonsterEntity, MonsterTriggerEntity],
  projections: [MonsterProjection],
  systems: [
    defineSystem("feature", "monster.lifetime", monsterLifetimeSystem),
    defineSystem("feature", "monster.spawn", monsterSpawnSystem),
  ],
  setup({ entities, mountPool }) {
    assertValidMonsterRules();
    createMonsterTriggerEntities(entities, MONSTER_RULES.spawnRules);
    const eids = createMonsterPool(entities, MONSTER_RULES.spawnRules);
    mountPool({
      eids,
      projection: MonsterProjection,
      create: () => new MonsterNode(),
    });
  },
});
```

- [ ] **Step 5: Register with one explicit line**

In temporary or final `GameFeatures.ts`:

```ts
import { MonsterFeature } from "./features/monster";

export const GAME_FEATURES = [
  // existing entries
  MonsterFeature,
];
```

- [ ] **Step 6: Verify**

```bash
npm test -- --run src/tests/game/features/monster src/tests/architecture
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: migrate monster into vertical slice"
```

---

### Task 6: Migrate PerfHero and Its Pool as a Vertical Slice

**Files:**
- Create directory: `src/game/features/perfHero/`
- Move: PerfHero component, entity, system, projection, contract, node, config and feature files
- Create: `PerfHeroRules.ts`
- Create: `PerfHeroViewConfig.ts`
- Create: `index.ts`
- Move tests into `src/tests/game/features/perfHero/`

- [ ] **Step 1: Split simulation and Laya presentation config**

`PerfHeroRules.ts` owns count limits and respawn duration. `PerfHeroViewConfig.ts` owns Spine URLs, zOrder, margins and scales.

- [ ] **Step 2: Move files and use Laya helpers**

`PerfHeroNode` and `PerfHeroSpinePoolGroup` must use `loadSpineTemplate`, `createSkeleton`, `destroyNode`, and `clearTweens` where applicable.

- [ ] **Step 3: Keep fixed-slot initialization explicit**

```ts
const eids = entities.createMany(
  PerfHeroEntity,
  Array.from({ length: config.heroCount }, (_, index) => index),
);
const pool = own(new PerfHeroSpinePoolGroup());
mountPool({
  eids,
  projection: PerfHeroProjection,
  create: () => new PerfHeroNode(pool),
});
```

- [ ] **Step 4: Verify stable entity count**

Add a test that runs `perfHeroSystem` across many respawn intervals and asserts the bitecs query length remains equal to the initialized slot count.

- [ ] **Step 5: Verify and commit**

```bash
npm test -- --run src/tests/game/features/perfHero src/tests/architecture
npx tsc --noEmit
git add -A
git commit -m "refactor: migrate perf hero into vertical slice"
```

---

### Task 7: Migrate Shrew, Hole and Scene as One Gameplay Slice

**Files:**
- Create directory: `src/game/features/shrew/`
- Move: Shrew/Hole/Scene/Animation components, enums, entity definitions, systems, lifecycle, projections, contracts, Nodes, hole/scene/shrew config and Feature
- Move related tests into `src/tests/game/features/shrew/`
- Create: `src/game/features/shrew/index.ts`

- [ ] **Step 1: Split the central component schema**

Move these definitions out of `src/ecs/components/index.ts`:

```text
ShrewComponent
HoleComponent
SceneComponent
AnimationComponent
```

Place them in `ShrewComponents.ts`. Move `ShrewType`, `ShrewAction`, `MapType`, `AnimType`, `HOLE_COUNT` and `GRID_SIZE` to `ShrewTypes.ts`.

- [ ] **Step 2: Move rule and view config**

`ShrewRules.ts` owns timings, hit radius and gameplay reset values. `ShrewViewConfig.ts` owns frame names, atlas names, clip layout, zOrder and visual offsets.

`HolePositions.ts` may remain a separate file inside the slice because it is data-heavy and changes independently.

- [ ] **Step 3: Move systems and projections**

Keep `ShrewProjection` engine-neutral: it imports components and `ShrewViewContract`, never `ShrewNode`.

- [ ] **Step 4: Keep topology explicit**

The setup must continue to show:

```ts
const holeEid = entities.create(HoleEntity, holeInput);
const shrewEid = entities.create(ShrewEntity, shrewInput);
HoleComponent.shrewEid[holeEid] = shrewEid;

const holeNode = mountOne({
  eid: holeEid,
  projection: HoleProjection,
  create: () => new HoleNode(),
});
mountOne({
  eid: shrewEid,
  projection: ShrewProjection,
  parent: holeNode.getContainer(),
  create: () => new ShrewNode(),
});
```

Do not replace this with `mountTree`.

- [ ] **Step 5: Use Laya helpers only for version-sensitive operations**

Migrate loader, tween cleanup, child destruction and runtime lookup. Leave direct `x/y/visible/zOrder/scale/addChild` code in Nodes.

- [ ] **Step 6: Verify**

```bash
npm test -- --run src/tests/game/features/shrew src/tests/view/ShrewNode.test.ts src/tests/view/SceneLayer.test.ts
npx tsc --noEmit
```

Expected: state machine, animation progress, scene cycle, topology and projection tests pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: migrate shrew gameplay into vertical slice"
```

---

### Task 8: Migrate Hammer and Player HUD, Then Remove Cross-Feature Ownership Leaks

**Files:**
- Create directories:
  - `src/game/features/hammer/`
  - `src/game/features/playerHud/`
  - `src/game/session/`
- Move Hammer component/entity/system/projection/contract/node/config/feature
- Move Player component/entity/projection/HUD/effects/config/feature
- Move and split:
  - `src/ecs/gameplay/hud/HitResponseSystem.ts`
  - `src/view/KickResponseAdapter.ts`
  - cross-feature thunder logic
- Modify tests for Hammer, HitResponse and effect flow

- [ ] **Step 1: Lock ownership in tests**

Add architecture assertions:

```ts
expect(readFile("hammer/HammerSystems.ts")).not.toContain("PlayerComponent");
expect(readFile("playerHud/PlayerSystems.ts")).not.toContain("HammerComponent");
```

Add behavior tests proving the session orchestration still updates both slices.

- [ ] **Step 2: Split response application**

Player slice:

```ts
export function applyPlayerKickResponse(playerEid: number, response: KickResponse): void;
```

Hammer slice:

```ts
export function applyHammerKickResponse(hammerEid: number, response: KickResponse): void;
```

Session flow:

```ts
export function routeKickResponse(
  world: any,
  effects: Pick<EffectRuntime, "emit">,
  response: KickResponse,
): void {
  const player = firstPlayer(world);
  const hammer = firstHammer(world);
  applyPlayerKickResponse(player, response);
  applyHammerKickResponse(hammer, response);
  for (const reward of response.shrewResp ?? []) {
    effects.emit(HitRewardEffect, reward);
  }
}
```

Rejected responses must return before either slice mutates.

- [ ] **Step 3: Move thunder threshold orchestration**

`HammerSystems.ts` owns cooldown and Hammer-only state. `game/session/ThunderSystem.ts` reads public Player state and writes public Hammer state:

```ts
export const ThunderSystem = defineSystem(
  "state",
  "session.thunder",
  thunderSystem,
);
```

This avoids Hammer importing Player internals.

- [ ] **Step 4: Move hit detection/input orchestration**

Pure hit detection that needs Shrew/Hole/Hammer belongs in `game/session/KickDetection.ts`. Laya stage coordinates remain in app input code; normalized game input enters the session controller.

Expose one session factory:

```ts
export function createKickInputController(options: {
  world: IWorld;
  effects: Pick<EffectRuntime, "emit">;
  network: KickNetworkPort;
}): KickInputController;
```

The controller resolves the singleton Hammer through `findHammer(world)` exported by `features/hammer/index.ts`; app code never receives or imports `HammerEntity`.

- [ ] **Step 5: Migrate Nodes and manifests**

HammerNode and PlayerHUD stay inside their slices and use framework Laya helpers only for version-sensitive calls.

- [ ] **Step 6: Verify**

```bash
npm test -- --run \
  src/tests/game/features/hammer \
  src/tests/game/features/playerHud \
  src/tests/game/session \
  src/tests/effects/HitEffectFlow.test.ts
npx tsc --noEmit
```

Expected: PASS with no cross-feature internal imports.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: isolate hammer and player session ownership"
```

---

### Task 9: Move the App Shell and Finalize Explicit Registration

**Files:**
- Move: `src/Main.ts` -> `src/app/Main.ts`
- Move: `src/Bootstrap.ts` -> `src/app/Bootstrap.ts`
- Move: `src/view/GameScene.ts` -> `src/app/GameScene.ts`
- Move: `src/view/GameLoopPipeline.ts` -> `src/app/GameLoopPipeline.ts`
- Move app-only input adapter to `src/app/KickInputAdapter.ts`
- Create/Modify: `src/game/GameFeatures.ts`
- Modify: build/debug entry paths and tests

- [ ] **Step 1: Make `GameFeatures.ts` the composition root**

```ts
import { ShrewFeature } from "./features/shrew";
import { HammerFeature } from "./features/hammer";
import { PlayerHudFeature } from "./features/playerHud";
import { MonsterFeature } from "./features/monster";
import { PerfHeroFeature } from "./features/perfHero";
import { SessionFeature } from "./session";

export const GAME_FEATURES = [
  ShrewFeature,
  HammerFeature,
  PlayerHudFeature,
  SessionFeature,
  PerfHeroFeature,
  MonsterFeature,
] as const;
```

Adding a normal independent feature must require one import and one array entry here.

- [ ] **Step 2: Remove concrete Feature knowledge from GameScene**

`GameScene` may import the registry/composition result and these session entry points:

```ts
import {
  createKickInputController,
  routeKickResponse,
} from "../game/session";
```

It must not import `HammerEntity`, `PlayerEntity`, `ShrewEntity` or another concrete entity definition. `createKickInputController` resolves the singleton Hammer internally through the Hammer slice's public `findHammer(world)` helper. Network callbacks call `routeKickResponse(world, effects, response)`; they do not mutate Feature components or view nodes directly.

- [ ] **Step 3: Move app shell files and update debug entry**

Update `src/Bootstrap.ts` equivalent and build scripts so debug-tsc still loads the correct entry.

- [ ] **Step 4: Verify**

```bash
npm test -- --run src/tests/Main.test.ts src/tests/view/GameScene.test.ts src/tests/view/GameLoopPipeline.test.ts src/tests/architecture
npx tsc --noEmit
npm run debug:ready
```

Expected: PASS and debug server ready.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: make game features the explicit composition root"
```

---

### Task 10: Remove Old Horizontal Business Directories

**Files:**
- Delete after empty:
  - `src/ecs/gameplay/**`
  - `src/ecs/components/**`
  - `src/features/**`
  - `src/sync/projections/**`
  - `src/sync/contracts/**`
  - business Node files under `src/view/**`
  - migrated business config files under `src/config/**`
- Modify: architecture tests
- Modify: imports and test paths

- [ ] **Step 1: Add absence assertions**

```ts
for (const obsolete of [
  "src/features",
  "src/ecs/gameplay",
  "src/sync/projections",
]) {
  expect(existsSync(obsolete)).toBe(false);
}
```

Do not require deletion of `src/view` until all remaining files are classified; generic app/debug view utilities may have moved elsewhere.

- [ ] **Step 2: Search for old paths**

Run:

```bash
rg -n "src/(features|ecs/gameplay|sync/projections|sync/contracts)|\\.\\./(features|ecs/gameplay|sync/projections|sync/contracts)" src docs
```

Expected: no production imports; historical plan documents may retain old paths.

- [ ] **Step 3: Delete empty directories and stale metadata**

Use `apply_patch` for tracked files. Do not delete generated `bin/` files manually.

- [ ] **Step 4: Verify**

```bash
npm test
npx tsc --noEmit
git diff --check
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove obsolete horizontal business layout"
```

---

### Task 11: Documentation, Laya Upgrade Check and Final Verification

**Files:**
- Modify: `AGENTS.md`
- Modify: `README.md`
- Modify: `docs/architecture.md`
- Modify: `docs/ecs-binding.md`
- Modify: `docs/laya-rules.md`
- Modify: `docs/test-guide.md`
- Modify: `docs/LayaAir3-Project-Onboarding.md`
- Modify: `.codex/skills/ecs-binding/SKILL.md`
- Modify: `.codex/skills/laya-runtime/SKILL.md`

- [ ] **Step 1: Document the final dependency map**

Include:

```text
framework -> no game imports
game feature -> own slice + framework
game session -> feature public APIs
app -> composition root + Laya
```

- [ ] **Step 2: Document Laya upgrade policy**

State explicitly:

- Wrap runtime lookup, loader, Spine construction, timer/tween/event cleanup and destruction.
- Do not wrap ordinary `x/y/visible/zOrder/scale/addChild`.
- Concrete Nodes remain in their business slice.
- A Laya major-version upgrade starts with tests under `src/tests/framework/view`.

- [ ] **Step 3: Add “new feature” checklist**

```text
1. Create src/game/features/foo.
2. Define components/entities/systems.
3. Define projection/effects.
4. Add contract and Laya Node.
5. Define FooFeature.
6. Export FooFeature from index.ts.
7. Add one explicit line in GameFeatures.ts.
```

- [ ] **Step 4: Run final verification**

```bash
npm test
npx tsc --noEmit
npm run debug:ready
git diff --check
```

Expected:

- All Vitest tests pass.
- TypeScript passes.
- Debug build succeeds.
- Architecture tests report no framework-to-game or cross-feature-internal imports.

- [ ] **Step 5: Browser smoke test**

Verify:

```text
normal debug page creates one canvas
click hit and miss paths produce no console errors
scene destroy/re-entry remains clean
perf=1&heroes=200 starts with stable slot count
```

If browser policy prevents isolated-port access, record the exact limitation; do not infer visual success from build output.

- [ ] **Step 6: Commit**

```bash
git add AGENTS.md README.md docs .codex/skills
git commit -m "docs: describe vertical feature architecture"
```

---

## Completion Criteria

- `src/framework/**` contains only stable reusable mechanics and never imports `src/game/**`.
- Each business slice owns its Component, Entity, System, Projection, contract, concrete Laya Node and feature-specific config.
- Concrete Nodes remain close to business code, while Laya version-sensitive operations are centralized in `framework/view`.
- Ordinary Node layout code still uses direct Laya properties; no shadow UI framework is introduced.
- `defineEntity`, `defineProjection`, `defineSystem`, `defineEffect`, `mountOne` and `mountPool` are the only new assembly primitives.
- No `BaseFeature`, automatic scanning, decorators, reflection or `mountTree`.
- Cross-feature rules live in `src/game/session` and import only feature public APIs.
- GameScene no longer imports concrete Feature entities.
- Adding an independent Feature requires its own directory plus one explicit registration entry in `src/game/GameFeatures.ts`.
- Full tests, typecheck, debug build and architecture boundary tests pass.

## Explicitly Out of Scope

- Supporting Cocos, Unity or another engine in the same repository.
- A virtual view tree or engine-neutral UI DSL.
- Automatic Feature discovery.
- Runtime Feature installation/uninstallation.
- Rewriting protobuf/network infrastructure.
- Frequent runtime `removeEntity` lifecycle.
