# Feature Assembly Primitives Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用两个小型框架装配 API 精简常见 Feature setup 样板，同时保留显式 Feature 注册和业务拓扑可读性。

**Architecture:** 在 `framework/feature` 下扩展现有 `FeatureSetupContext`，新增 `mountSingleton` 和 `createAndMountMany`。框架只吸收实体创建、视图创建、projection mount、view ownership 这些机械步骤；父子拓扑、池输入构造、配置校验、effect 订阅仍留在业务切片。

**Tech Stack:** TypeScript, Vitest, bitecs, LayaAir runtime boundary.

---

## Scope

保留：
- `src/game/GameFeatures.ts` 显式注册。
- `defineFeature` 的 `entities/projections/systems/setup` 结构。
- `ShrewFeature` 的显式父子拓扑装配。
- `MonsterFeature` 的规则校验、trigger 创建、pool 输入构造。

新增：
- `ctx.mountSingleton(...)`: 对 `entities.one(Entity) + mountOne(...)` 的意图化封装。
- `ctx.createAndMountMany(...)`: 对 `entities.createMany(Entity, inputs) + mountPool(...)` 的意图化封装。

暂不做：
- 自动目录扫描。
- `BaseFeature`。
- `views: [...]` 自动推导 `entities/projections` 的 DSL。
- `mountTree`。
- effect subscription helper。

## Files

- Modify: `src/framework/feature/ViewMounting.ts`
  - 增加 `MountSingletonOptions` 和 `CreateAndMountManyOptions` 类型。
- Modify: `src/framework/feature/FeatureSetupContext.ts`
  - 在 `FeatureSetupContext` 暴露 `mountSingleton`、`createAndMountMany`。
  - 复用现有 `mountOne`、`mountPool`，不复制 mount 细节。
- Modify: `src/tests/features/GameFeatureRegistry.test.ts`
  - 更新测试 mock context。
  - 增加两个框架 helper 的行为测试。
- Modify: `src/game/features/hammer/HammerFeature.ts`
  - 用 `mountSingleton` 替换手写 `entities.one + mountOne`。
- Modify: `src/game/features/playerHud/PlayerHUDFeature.ts`
  - 用 `mountSingleton` 替换 PlayerHUD 单例视图挂载，保留 `createView` 和 effect 订阅。
- Modify: `src/game/features/perfHero/PerfHeroFeature.ts`
  - 用 `createAndMountMany` 替换 `createMany + mountPool`。
- Optional Modify: `docs/ecs-binding.md`
  - 如果文档已有 Feature setup 示例，同步补一段新 helper 使用方式。

## Task 1: Framework API Types

**Files:**
- Modify: `src/framework/feature/ViewMounting.ts`

- [ ] **Step 1: Add option types**

Update `src/framework/feature/ViewMounting.ts` to add imports and two option interfaces:

```ts
import type { EntityDefinition } from "../ecs/EntityDefinition";
import type { ProjectionDefinition } from "../sync/ProjectionDefinition";
import type { Destroyable } from "../view/ViewRegistry";

export interface MountableView extends Destroyable {
  create(parent: any): void;
}

export interface CreateViewOptions<TNode extends MountableView> {
  readonly parent?: any;
  readonly create: () => TNode;
}

export interface MountOneOptions<TNode extends MountableView>
  extends CreateViewOptions<TNode> {
  readonly eid: number;
  readonly projection: ProjectionDefinition<TNode>;
}

export interface MountPoolOptions<TNode extends MountableView> {
  readonly eids: readonly number[];
  readonly projection: ProjectionDefinition<TNode>;
  readonly parent?: any;
  readonly create: (eid: number, index: number) => TNode;
}

export interface MountSingletonOptions<TNode extends MountableView>
  extends CreateViewOptions<TNode> {
  readonly entity: EntityDefinition<void>;
  readonly projection: ProjectionDefinition<TNode>;
}

export interface CreateAndMountManyOptions<TInput, TNode extends MountableView> {
  readonly entity: EntityDefinition<TInput>;
  readonly inputs: readonly TInput[];
  readonly projection: ProjectionDefinition<TNode>;
  readonly parent?: any;
  readonly create: (eid: number, index: number) => TNode;
}
```

- [ ] **Step 2: Run typecheck**

Run:

```bash
npx tsc --noEmit
```

Expected: It may fail if project tsconfig does not support root typecheck with `--noEmit`; if it fails for config unrelated to these edits, continue to targeted Vitest after Task 2. If it succeeds, there should be no TypeScript diagnostics.

## Task 2: Context Implementation

**Files:**
- Modify: `src/framework/feature/FeatureSetupContext.ts`
- Test: `src/tests/features/GameFeatureRegistry.test.ts`

- [ ] **Step 1: Write failing tests for helper behavior**

Append these tests inside `describe("GameFeatureRegistry", () => { ... })` in `src/tests/features/GameFeatureRegistry.test.ts`:

```ts
  it("mounts singleton entity views through setup context capability", () => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, [TestSceneEntity]);
    entities.bootstrapSingletons();
    const setup = createSetupContext(entities);

    const node = setup.context.mountSingleton({
      entity: TestSceneEntity,
      projection: TestSceneProjection,
      create: () => ({ destroy: () => {}, create: () => {} }),
    });

    expect(node).toBeDefined();
    expect(Object.fromEntries(setup.mounts)).toEqual({ testScene: 1 });
  });

  it("creates and mounts many entity views through setup context capability", () => {
    const ManyEntity = defineEntity<number>({
      name: "testMany",
      components: [SceneComponent],
      cardinality: "many",
      initialize: (eid, value) => {
        SceneComponent.currentMap[eid] = value;
      },
    });
    const ManyProjection = defineProjection({
      name: "testMany",
      components: [SceneComponent],
      rows: [watch(sceneSource, ["currentMap"], "current map", noProjection)],
    });
    const world = createGameWorld();
    const entities = createEntityRuntime(world, [ManyEntity]);
    const setup = createSetupContext(entities);

    const nodes = setup.context.createAndMountMany({
      entity: ManyEntity,
      inputs: [1, 2, 3],
      projection: ManyProjection,
      create: () => ({ destroy: () => {}, create: () => {} }),
    });

    expect(nodes).toHaveLength(3);
    expect(Object.fromEntries(setup.mounts)).toEqual({ testMany: 3 });
  });
```

- [ ] **Step 2: Run failing test**

Run:

```bash
npm test -- src/tests/features/GameFeatureRegistry.test.ts
```

Expected: FAIL because `FeatureSetupContext` does not yet expose `mountSingleton` and `createAndMountMany`.

- [ ] **Step 3: Implement context methods**

Update imports and interface in `src/framework/feature/FeatureSetupContext.ts`:

```ts
import type {
  CreateAndMountManyOptions,
  CreateViewOptions,
  MountableView,
  MountOneOptions,
  MountPoolOptions,
  MountSingletonOptions,
} from "./ViewMounting";

export interface FeatureSetupContext {
  readonly entities: EntityRuntime;
  readonly effects: Pick<EffectRuntime, "on" | "emit">;
  createView<TNode extends MountableView>(options: CreateViewOptions<TNode>): TNode;
  mountOne<TNode extends MountableView>(options: MountOneOptions<TNode>): TNode;
  mountPool<TNode extends MountableView>(options: MountPoolOptions<TNode>): TNode[];
  mountSingleton<TNode extends MountableView>(options: MountSingletonOptions<TNode>): TNode;
  createAndMountMany<TInput, TNode extends MountableView>(
    options: CreateAndMountManyOptions<TInput, TNode>,
  ): TNode[];
  own<TResource extends Destroyable>(resource: TResource): TResource;
}
```

Add methods in the returned object from `createFeatureSetupContext`:

```ts
    mountSingleton: options => mountOne({
      eid: deps.entityRuntime.one(options.entity),
      projection: options.projection,
      parent: options.parent,
      create: options.create,
    }),
    createAndMountMany: options => {
      const eids = deps.entityRuntime.createMany(options.entity, options.inputs);
      return mountPool({
        eids,
        projection: options.projection,
        parent: options.parent,
        create: options.create,
      });
    },
```

- [ ] **Step 4: Update test mock context**

In `createSetupContext` inside `src/tests/features/GameFeatureRegistry.test.ts`, add mock implementations that mirror the framework behavior:

```ts
    mountSingleton: ({ entity, projection, create }: any) => {
      const eid = entities.one(entity);
      mounts.set(projection.name, (mounts.get(projection.name) ?? 0) + 1);
      return create(eid, 0);
    },
    createAndMountMany: ({ entity, inputs, projection, create }: any) => {
      const eids = entities.createMany(entity, inputs);
      return eids.map((eid: number, index: number) => {
        mounts.set(projection.name, (mounts.get(projection.name) ?? 0) + 1);
        return create(eid, index);
      });
    },
```

- [ ] **Step 5: Run focused test**

Run:

```bash
npm test -- src/tests/features/GameFeatureRegistry.test.ts
```

Expected: PASS.

## Task 3: Migrate Simple Singleton Features

**Files:**
- Modify: `src/game/features/hammer/HammerFeature.ts`
- Modify: `src/game/features/playerHud/PlayerHUDFeature.ts`
- Test: `src/tests/features/GameFeatureRegistry.test.ts`

- [ ] **Step 1: Migrate HammerFeature**

Change setup in `src/game/features/hammer/HammerFeature.ts`:

```ts
  setup: ({ mountSingleton }) => {
    mountSingleton({
      entity: HammerEntity,
      projection: HammerProjection,
      create: () => new HammerNode(),
    });
  },
```

- [ ] **Step 2: Migrate PlayerHUDFeature**

Change setup signature and PlayerHUD mount in `src/game/features/playerHud/PlayerHUDFeature.ts`:

```ts
  setup: ({ effects, mountSingleton, createView }) => {
    mountSingleton({
      entity: PlayerEntity,
      projection: PlayerProjection,
      create: () => new PlayerHUD(),
    });
    const hitEffectNode = createView({
      create: () => new HitEffectNode(),
    });
    effects.on(HitRewardEffect, payload => {
      hitEffectNode.showReward(payload.shrewIndex, payload.reward);
    });
    effects.on(HitMissEffect, () => {
      hitEffectNode.showMiss();
    });
  },
```

- [ ] **Step 3: Run registry lifecycle test**

Run:

```bash
npm test -- src/tests/features/GameFeatureRegistry.test.ts
```

Expected: PASS. Existing complete runtime setup count remains:

```ts
{
  scene: 1,
  hole: 9,
  shrew: 9,
  hammer: 1,
  player: 1,
  monster: MONSTER_SPAWN_RULES.reduce((count, rule) => count + rule.maxActiveCount, 0),
}
```

## Task 4: Migrate PerfHero Pool Feature

**Files:**
- Modify: `src/game/features/perfHero/PerfHeroFeature.ts`
- Test: `src/tests/features/GameFeatureRegistry.test.ts`
- Test: `src/tests/game/features/perfHero/PerfHeroSystem.test.ts`

- [ ] **Step 1: Migrate PerfHeroFeature**

Change setup in `src/game/features/perfHero/PerfHeroFeature.ts`:

```ts
  setup: ({ createAndMountMany, own }) => {
    const config = getPerfRuntimeConfig();
    if (config.heroCount <= 0) return;

    const pool = own(new PerfHeroSpinePoolGroup());
    createAndMountMany({
      entity: PerfHeroEntity,
      inputs: Array.from({ length: config.heroCount }, (_, index) => index),
      projection: PerfHeroProjection,
      create: () => new PerfHeroNode(pool),
    });
  },
```

- [ ] **Step 2: Run focused tests**

Run:

```bash
npm test -- src/tests/features/GameFeatureRegistry.test.ts src/tests/game/features/perfHero/PerfHeroSystem.test.ts
```

Expected: PASS.

## Task 5: Keep Complex Topology Explicit

**Files:**
- Review only: `src/game/features/shrew/ShrewFeature.ts`
- Review only: `src/game/features/monster/MonsterFeature.ts`

- [ ] **Step 1: Leave ShrewFeature topology unchanged**

Do not replace the loop in `setupCoreGameplay`. The explicit sequence below must remain visible because it is business topology:

```ts
const holeEid = entities.create(HoleEntity, {
  index,
  mapType: MapType.Meadow,
});
const shrewEid = entities.create(ShrewEntity, {
  shrewType: randomShrewType(),
  mapType: MapType.Meadow,
});
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

- [ ] **Step 2: Leave MonsterFeature pool creation unchanged**

Do not force `MonsterFeature` into `createAndMountMany` yet because `createMonsterPool(...)` and trigger setup are domain-specific and already named well:

```ts
createMonsterTriggerEntities(entities, MONSTER_SPAWN_RULES);
const eids = createMonsterPool(
  entities,
  createMonsterPoolInputs(MONSTER_SPAWN_RULES, MONSTER_VIEW_CONFIG, MONSTER_DURATION_SEC),
);
mountPool({
  eids,
  projection: MonsterProjection,
  create: () => new MonsterNode(),
});
```

- [ ] **Step 3: Run architecture boundary tests**

Run:

```bash
npm test -- src/tests/architecture/FeatureSliceBoundary.test.ts src/tests/architecture/ExplicitFeatureRegistration.test.ts src/tests/architecture/FrameworkBoundary.test.ts
```

Expected: PASS. No new cross-feature internal imports, no automatic registration, no framework-to-game dependency.

## Task 6: Optional Docs

**Files:**
- Optional Modify: `docs/ecs-binding.md`

- [ ] **Step 1: Inspect docs for setup examples**

Run:

```bash
rg "mountOne|mountPool|setup" docs/ecs-binding.md docs/architecture.md docs/getting-started.md
```

Expected: Find any Feature setup examples that mention `mountOne` or `mountPool`.

- [ ] **Step 2: Update only if examples exist**

If `docs/ecs-binding.md` contains a Feature setup example, add this short guidance near it:

```md
常见单例视图优先使用 `ctx.mountSingleton({ entity, projection, create })`，
常见固定输入池优先使用 `ctx.createAndMountMany({ entity, inputs, projection, create })`。
父子拓扑、规则校验、trigger 创建和跨实体关系仍应在 Feature setup 中显式表达。
```

- [ ] **Step 3: Run docs grep**

Run:

```bash
rg "mountSingleton|createAndMountMany" docs src/framework src/game/features
```

Expected: New API names appear only in framework, migrated simple features, tests, and optional docs.

## Task 7: Full Verification And Commit

**Files:**
- Verify all modified files.

- [ ] **Step 1: Run focused feature tests**

Run:

```bash
npm test -- src/tests/features/GameFeatureRegistry.test.ts src/tests/features/GameFeatureRuntime.test.ts src/tests/features/GameRuntimeLifecycle.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run architecture tests**

Run:

```bash
npm test -- src/tests/architecture/FeatureSliceBoundary.test.ts src/tests/architecture/ExplicitFeatureRegistration.test.ts src/tests/architecture/FrameworkBoundary.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run full test suite**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 4: Run debug readiness**

Run:

```bash
npm run debug:ready
```

Expected: TypeScript debug build succeeds and debug server starts. Stop the server after confirming readiness if it remains attached.

- [ ] **Step 5: Review diff**

Run:

```bash
git diff -- src/framework/feature/ViewMounting.ts src/framework/feature/FeatureSetupContext.ts src/tests/features/GameFeatureRegistry.test.ts src/game/features/hammer/HammerFeature.ts src/game/features/playerHud/PlayerHUDFeature.ts src/game/features/perfHero/PerfHeroFeature.ts docs/ecs-binding.md
```

Expected: Diff only contains helper API, targeted migrations, tests, and optional docs.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/framework/feature/ViewMounting.ts src/framework/feature/FeatureSetupContext.ts src/tests/features/GameFeatureRegistry.test.ts src/game/features/hammer/HammerFeature.ts src/game/features/playerHud/PlayerHUDFeature.ts src/game/features/perfHero/PerfHeroFeature.ts docs/ecs-binding.md
git commit -m "精简 Feature 视图装配 API"
```

Expected: Commit succeeds with only intended files staged. If `docs/ecs-binding.md` was not changed, omit it from `git add`.

## Self Review

- Spec coverage: The plan adds only the two agreed small framework helpers, migrates representative simple features, and explicitly preserves registration and complex topology.
- Placeholder scan: No `TODO`, `TBD`, or unspecified test steps.
- Type consistency: `mountSingleton`, `createAndMountMany`, `MountSingletonOptions`, and `CreateAndMountManyOptions` use consistent names across types, implementation, tests, and migrations.
