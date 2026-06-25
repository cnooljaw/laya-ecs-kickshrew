# Compiled Feature Runtime Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 Hammer、PerfHero、Monster、Shrew/Hole/Scene、Player/HUD 等业务只声明实体、系统、投影、拓扑和瞬时效果，由框架统一处理 ECS 创建、dirty typed arrays、首次同步、节点注册和整局销毁。

**Architecture:** 新增初始化期编译的 `EntityRuntime`、`ProjectionRuntime` 和 typed `EffectRuntime`。业务继续使用 bitecs component 与纯 system；projection 在初始化时编译 query、字段快照、bitmask 和 node registry，运行期仍只执行预计算 query、typed-array 比较和直接函数调用。迁移期间旧 `DirtyComponent/ViewSyncModule/SyncView` 与新 runtime 并存，逐个 Feature 迁移后再删除旧链路。

**Tech Stack:** TypeScript 6、bitecs 0.3、Vitest 2、LayaAir3。

---

## 三技能审查结论

### Clean Coder Review

- 业务目前仍知道 `DirtyComponent`、dirty target、bit、registry key、`forceFullSync` 和资源 owner 协议，违反信息隐藏。
- `FeatureSetupContext` 含 `singletons`、`perfConfig` 等具体业务知识，不是稳定框架接口。
- `src/ecs/world.ts` 集中创建所有业务实体，新增 Feature 仍需修改中心模块。
- 不采用继承式 `BaseFeature`、自动目录扫描或大 DSL。使用职责单一、可组合的 `defineEntityType`、`defineProjection`、`views.mount`、`effects.on/emit`。

### Game Client Architect

- 保持一局一个 world，运行期不依赖频繁 `removeEntity`；singleton、固定拓扑和 pool 均在初始化阶段创建。
- 保持每帧顺序可读：`state systems -> network -> feature systems -> dirty mark -> view sync -> effects flush`。
- projection runtime 在初始化阶段允许创建 query、snapshot 和 typed arrays，运行期不得按帧创建临时对象或动态注册。
- View 和共享 Spine pool 仍由场景 runtime 统一销毁；异步 Laya 资源继续由 Node 自身防止 destroy 后回调。

### ECS Binding

- ECS component 仍是权威状态，system 不依赖 Laya。
- 保留 “dirty mark / view sync” 两阶段概念，但 dirty array、bit 分配和 full-sync 状态改为 projection runtime 私有实现。
- 同一 node 的 Shrew 状态与 Animation 状态合并为一个 projection，避免共享 registry key 和跨 module bit 协调。
- `HitEffect` 不是持久 ECS 状态，改用 typed effect channel；Hammer 的 `hitSeq` 保留，因为它属于持久 Hammer entity 的可重放反馈序列。

## 最终业务 API 目标

```ts
export const HammerFeature = defineGameFeature({
  name: "hammer",
  entities: [HammerEntity],
  projections: [HammerProjection],
  systems: {
    state: [updateHammer],
  },
  setup: ({ entities, views }) => {
    views.mount({
      eid: entities.one(HammerEntity),
      projection: HammerProjection,
      create: () => new HammerNode(),
    });
  },
});
```

```ts
export const MonsterFeature = defineGameFeature({
  name: "monster",
  entities: [MonsterEntity, MonsterTriggerEntity],
  projections: [MonsterProjection],
  systems: {
    feature: [monsterLifetimeSystem, monsterSpawnSystem],
  },
  setup: ({ entities, views }) => {
    validateMonsterConfig();
    createMonsterTriggerEntities(entities, MONSTER_SPAWN_RULES);
    const monsters = createMonsterPool(entities, MONSTER_SPAWN_RULES);
    views.mountMany({
      eids: monsters,
      projection: MonsterProjection,
      create: () => new MonsterNode(),
    });
  },
});
```

## 文件结构

新增框架文件：

```text
src/ecs/runtime/EntityType.ts
src/ecs/runtime/EntityRuntime.ts
src/sync/projection/ProjectionDefinition.ts
src/sync/projection/ProjectionRuntime.ts
src/effects/EffectDefinition.ts
src/effects/EffectRuntime.ts
src/features/FeatureRuntimeContext.ts
```

迁移后的业务定义就近放置：

```text
src/ecs/gameplay/hammer/HammerEntity.ts
src/ecs/gameplay/monster/MonsterEntity.ts
src/ecs/gameplay/perfHero/PerfHeroEntity.ts
src/ecs/gameplay/core/CoreEntities.ts
src/sync/projections/HammerProjection.ts
src/sync/projections/MonsterProjection.ts
src/sync/projections/PerfHeroProjection.ts
src/sync/projections/CoreProjections.ts
src/sync/projections/HudProjection.ts
```

本轮不做 `src/framework/**` 和 `src/game/features/**` 的目录大搬迁。先修复知识边界，再决定目录是否需要变化。

---

### Task 1: 锁定现有运行流并暴露 Hit 死链

**Files:**
- Modify: `src/tests/features/GameFeatureRegistry.test.ts`
- Modify: `src/tests/view/GameLoopPipeline.test.ts`

- [ ] **Step 1: 增加 Feature 贡献顺序的行为测试**

在 `GameFeatureRegistry.test.ts` 增加：

```ts
it("按 feature 声明顺序稳定展开 systems 和 projections", () => {
  const registry = createGameFeatureRegistry([
    feature("first"),
    feature("second"),
  ]);

  expect(registry.systemsByPhase("feature").map(item => item.name)).toEqual([
    "first:system",
    "second:system",
  ]);
});
```

- [ ] **Step 2: 增加主循环阶段顺序测试**

将 `GameLoopPipeline.test.ts` 的断言扩展为：

```ts
expect(order).toEqual([
  "state",
  "network",
  "feature",
  "dirty",
  "sync",
]);
```

测试通过依赖注入的 spy，禁止读取私有数组。

- [ ] **Step 3: 用结构搜索确认 Hit 当前死链**

Run:

```bash
rg -n "addComponent\\([^\\n]*HitComponent|HitComponent\\.(shrewIndex|reward|wasHit)" src --glob '!src/tests/**'
```

Expected: 只看到 `HitViewSyncSpec` 读取字段，不出现生产代码创建或写入 Hit entity。不要提交锁定错误行为的测试；Task 9 直接从期望的 Effect 行为写 Red。

- [ ] **Step 4: 跑现有基线**

Run:

```bash
npm test -- --run src/tests/features/GameFeatureRegistry.test.ts src/tests/view/GameLoopPipeline.test.ts
```

Expected: PASS。

- [ ] **Step 5: 提交行为锁定**

```bash
git add src/tests/features/GameFeatureRegistry.test.ts src/tests/view/GameLoopPipeline.test.ts
git commit -m "test: lock feature runtime behavior"
```

---

### Task 2: 引入 EntityType 和 EntityRuntime

**Files:**
- Create: `src/ecs/runtime/EntityType.ts`
- Create: `src/ecs/runtime/EntityRuntime.ts`
- Create: `src/tests/ecs/EntityRuntime.test.ts`

- [ ] **Step 1: 写 singleton、many 和清理测试**

```ts
const CounterComponent = defineComponent({ value: Types.ui32 });

const CounterEntity = defineEntityType({
  name: "counter",
  components: [CounterComponent],
  cardinality: "one",
  initialize: (eid, value: number = 0) => {
    CounterComponent.value[eid] = value;
  },
});

it("预创建 singleton 并按 definition 获取 eid", () => {
  const world = createWorld();
  const runtime = createEntityRuntime(world, [CounterEntity]);

  runtime.bootstrapSingletons();

  expect(CounterComponent.value[runtime.one(CounterEntity)]).toBe(0);
});

it("按输入创建稳定 entity pool", () => {
  const world = createWorld();
  const runtime = createEntityRuntime(world, []);

  const eids = runtime.createMany(CounterEntity, [1, 2, 3]);

  expect(eids.map(eid => CounterComponent.value[eid])).toEqual([1, 2, 3]);
});
```

- [ ] **Step 2: 运行测试确认缺少 API**

Run:

```bash
npm test -- --run src/tests/ecs/EntityRuntime.test.ts
```

Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现实体定义**

`EntityType.ts`：

```ts
export interface EntityType<TInput = void> {
  readonly name: string;
  readonly components: readonly any[];
  readonly cardinality: "one" | "many";
  readonly initialize: (eid: number, input: TInput) => void;
}

export function defineEntityType<TInput = void>(
  definition: EntityType<TInput>,
): EntityType<TInput> {
  return definition;
}
```

- [ ] **Step 4: 实现 EntityRuntime**

`EntityRuntime.ts` 必须：

```ts
export interface EntityRuntime {
  bootstrapSingletons(): void;
  one<TInput>(type: EntityType<TInput>): number;
  create<TInput>(type: EntityType<TInput>, input: TInput): number;
  createMany<TInput>(type: EntityType<TInput>, inputs: readonly TInput[]): number[];
  clear(): void;
}
```

创建逻辑：

```ts
const eid = addEntity(world);
for (const component of type.components) {
  addComponent(world, component, eid);
}
type.initialize(eid, input);
```

`clear()` 只清除 runtime 索引，不逐个 `removeEntity`，world 由 `GameScene.destroy()` 整体删除。

- [ ] **Step 5: 验证**

Run:

```bash
npm test -- --run src/tests/ecs/EntityRuntime.test.ts
npx tsc --noEmit
```

Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add src/ecs/runtime src/tests/ecs/EntityRuntime.test.ts
git commit -m "feat: add ecs entity runtime"
```

---

### Task 3: 引入无全局 DirtyComponent 依赖的 ProjectionDefinition

**Files:**
- Create: `src/sync/projection/ProjectionDefinition.ts`
- Create: `src/tests/sync/ProjectionDefinition.test.ts`

- [ ] **Step 1: 写自动 bit、字段声明和上限测试**

```ts
const source = projectionSource("counter", CounterComponent);

const projection = defineProjection<ICounterView>({
  name: "counter",
  components: [CounterComponent],
  rows: [
    watch(source, ["value"], "counter value", ({ eid, node }) => {
      node.setValue(CounterComponent.value[eid]);
    }),
  ],
});

expect(projection.rows[0].bit).toBe(1);
expect(projection.rows[0].fields[0].path).toBe("counter.value");
```

增加 33 行 projection 测试：

```ts
expect(() => defineProjection({ name: "overflow", components: [], rows }))
  .toThrow("Projection overflow 最多支持 32 个 dirty row");
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
npm test -- --run src/tests/sync/ProjectionDefinition.test.ts
```

Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现声明 API**

核心类型：

```ts
export interface ProjectionSource<TComponent extends Record<string, ArrayLike<number>>> {
  readonly name: string;
  readonly component: TComponent;
}

export interface ProjectionField {
  readonly path: string;
  readonly values: ArrayLike<number>;
}

export interface ProjectionContext<TNode> {
  readonly eid: number;
  readonly node: TNode;
}

export type ProjectionApply<TNode> = (context: ProjectionContext<TNode>) => void;

export interface ProjectionRow<TNode> {
  readonly bit: number;
  readonly label: string;
  readonly fields: readonly ProjectionField[];
  readonly apply: ProjectionApply<TNode>;
}

export interface ProjectionDefinition<TNode> {
  readonly name: string;
  readonly components: readonly any[];
  readonly rows: readonly ProjectionRow<TNode>[];
}
```

业务 row 不传 bit：

```ts
watch(source, ["posX", "posY"], "position", applyPosition)
```

`ProjectionDefinition.ts` 定义自己的 `ProjectionField/ProjectionApply`，不得 import 旧 `DirtyField` 或 `ViewSyncApply`。`defineProjection()` 按 row index 分配 `2 ** index`，并拒绝没有 watched field 的 row。`noProjection` 在新模块内定义。

- [ ] **Step 4: 验证**

Run:

```bash
npm test -- --run src/tests/sync/ProjectionDefinition.test.ts
npx tsc --noEmit
```

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/sync/projection/ProjectionDefinition.ts src/tests/sync/ProjectionDefinition.test.ts
git commit -m "feat: define compiled view projections"
```

---

### Task 4: 实现 ProjectionRuntime 的 mark/sync 两阶段

**Files:**
- Create: `src/sync/projection/ProjectionRuntime.ts`
- Create: `src/tests/sync/ProjectionRuntime.test.ts`
- Modify: `src/view/GameLoopPipeline.ts`
- Modify: `src/tests/view/GameLoopPipeline.test.ts`

- [ ] **Step 1: 写首次同步、差量同步、无变化和 clear 测试**

```ts
const runtime = createProjectionRuntime([CounterProjection]);
const node = { values: [] as number[], setValue(value: number) { this.values.push(value); } };
runtime.mount(CounterProjection, eid, node);

runtime.mark(world);
runtime.sync(world);
expect(node.values).toEqual([0]);

runtime.mark(world);
runtime.sync(world);
expect(node.values).toEqual([0]);

CounterComponent.value[eid] = 2;
runtime.mark(world);
runtime.sync(world);
expect(node.values).toEqual([0, 2]);
```

`clear()` 后：

```ts
expect(runtime.projections()).toEqual([]);
expect(() => runtime.mount(CounterProjection, eid, node))
  .toThrow("Projection 未编译: counter");
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
npm test -- --run src/tests/sync/ProjectionRuntime.test.ts
```

Expected: FAIL。

- [ ] **Step 3: 实现初始化期编译**

每个 compiled projection 持有：

```ts
interface CompiledProjection<TNode> {
  definition: ProjectionDefinition<TNode>;
  query: ReturnType<typeof defineQuery>;
  dirtyBits: Uint32Array;
  fullSync: Uint8Array;
  snapshots: Map<number, Float64Array>;
  nodes: Map<number, TNode>;
}
```

数组长度从第一个 watched field 的 typed array 长度取得。ProjectionRuntime 自己维护 eid/node Map，不 import 旧 `ViewNodeRegistry`。禁止业务传 `dirtyTarget`。

- [ ] **Step 4: 实现 mark**

`mark(world)`：

1. 遍历 projection query。
2. 第一次看到 eid 时创建一次 `Float64Array(fieldCount)` snapshot，并将全部 row bit 写入 `dirtyBits[eid]`。
3. 后续逐字段比较；变化字段对应 row bit OR 到 `dirtyBits[eid]`。
4. 原地更新 snapshot，帧内不创建 row 临时数组。

- [ ] **Step 5: 实现 sync**

`sync(world)`：

1. 遍历 projection query。
2. 读取 `dirtyBits[eid]` 与 `fullSync[eid]`。
3. registry 无 node 时跳过。
4. 调用匹配 row；同一 apply 函数同帧只调用一次。
5. 清零该 projection 的 `dirtyBits/fullSync`。

`mount()` 注册 node 并设置 `fullSync[eid] = 1`。

- [ ] **Step 6: 将新 runtime 接入主循环兼容阶段**

`GameLoopPipelineDeps` 增加可选：

```ts
projectionRuntime?: Pick<ProjectionRuntime, "mark" | "sync">;
```

每帧顺序：

```ts
dirtyMarkSystem(world, featureRegistry.dirtyAspects());
syncView.sync(world);
projectionRuntime?.mark(world);
projectionRuntime?.sync(world);
```

迁移完成前保留旧链路。

- [ ] **Step 7: 验证**

Run:

```bash
npm test -- --run src/tests/sync/ProjectionRuntime.test.ts src/tests/view/GameLoopPipeline.test.ts
npx tsc --noEmit
```

Expected: PASS。

- [ ] **Step 8: 提交**

```bash
git add src/sync/projection src/tests/sync/ProjectionRuntime.test.ts src/view/GameLoopPipeline.ts src/tests/view/GameLoopPipeline.test.ts
git commit -m "feat: compile projection runtime"
```

---

### Task 5: 稳定 Feature Runtime Context

**Files:**
- Modify: `src/features/GameFeature.ts`
- Modify: `src/features/GameFeatureRegistry.ts`
- Replace: `src/features/GameFeatureRuntime.ts`
- Create: `src/features/FeatureRuntimeContext.ts`
- Modify: `src/tests/features/GameFeatureRegistry.test.ts`
- Modify: `src/tests/features/GameFeatureRuntime.test.ts`

- [ ] **Step 1: 写新 Feature Manifest 测试**

目标接口：

```ts
export interface GameFeature {
  name: string;
  entities?: readonly EntityType<any>[];
  projections?: readonly ProjectionDefinition<any>[];
  systems?: {
    state?: readonly GameSystem[];
    feature?: readonly GameSystem[];
  };
  setup?: (ctx: FeatureRuntimeContext) => void;
}
```

同时提供只做类型收窄的 helper：

```ts
export function defineGameFeature(feature: GameFeature): GameFeature {
  return feature;
}
```

测试 registry：

```ts
expect(registry.entityTypes()).toEqual([CounterEntity]);
expect(registry.projections()).toEqual([CounterProjection]);
expect(registry.systemsByPhase("state")).toEqual([stateSystem]);
```

重复 entity/projection/system function name 必须报错。

- [ ] **Step 2: 写 Context 能力测试**

```ts
context.views.mount({
  eid,
  projection: CounterProjection,
  create: () => node,
});

expect(projectionRuntime.nodeFor(CounterProjection, eid)).toBe(node);
expect(node.createdWith).toBe(root);
```

`resources.own()` 在 context clear 时逆序销毁。

- [ ] **Step 3: 运行测试确认失败**

Run:

```bash
npm test -- --run src/tests/features/GameFeatureRegistry.test.ts src/tests/features/GameFeatureRuntime.test.ts
```

Expected: FAIL。

- [ ] **Step 4: 实现稳定能力接口**

```ts
export interface FeatureRuntimeContext {
  readonly world: any;
  readonly entities: EntityRuntime;
  readonly views: {
    mount<TNode extends MountableView>(options: {
      eid: number;
      projection: ProjectionDefinition<TNode>;
      parent?: any;
      create: () => TNode;
    }): TNode;
    mountMany<TNode extends MountableView>(options: {
      eids: readonly number[];
      projection: ProjectionDefinition<TNode>;
      parent?: any;
      create: (eid: number, index: number) => TNode;
    }): TNode[];
  };
  readonly resources: {
    own<T extends Destroyable>(resource: T): T;
  };
}
```

`MountableView`：

```ts
export interface MountableView extends Destroyable {
  create(parent: any): void;
}
```

新增代码只使用 `entities/views/resources`。迁移阶段 context 暂时保留并标记 deprecated：

```ts
/** @deprecated compatibility only; remove in Task 10 */
singletons: SingletonEntities;
/** @deprecated compatibility only; remove in Task 10 */
perfConfig: PerfTestRuntimeConfig;
/** @deprecated compatibility only; remove in Task 10 */
mount: LegacyMount;
/** @deprecated compatibility only; remove in Task 10 */
own: LegacyOwn;
```

这样未迁移 Feature 在每个中间 commit 都能继续编译；Task 10 再统一删除。

- [ ] **Step 5: Registry 同时支持旧字段和新字段**

迁移期间 `GameFeature` 临时保留 deprecated `viewSyncs` 与旧 `FeatureSystemEntry[]`，registry 同时展开两类贡献。增加注释标明最终删除任务。

- [ ] **Step 6: 验证**

Run:

```bash
npm test -- --run src/tests/features
npx tsc --noEmit
```

Expected: PASS。

- [ ] **Step 7: 提交**

```bash
git add src/features src/tests/features
git commit -m "refactor: expose stable feature capabilities"
```

---

### Task 6: 用 Hammer 验证 singleton + projection 最小路径

**Files:**
- Create: `src/ecs/gameplay/hammer/HammerEntity.ts`
- Create: `src/sync/projections/HammerProjection.ts`
- Modify: `src/features/HammerFeature.ts`
- Modify: `src/view/GameScene.ts`
- Modify: `src/view/KickInputAdapter.ts`
- Modify: `src/ecs/world.ts`
- Modify: `src/tests/ecs/HammerSystem.test.ts`
- Modify: `src/tests/sync/CoreViewSync.test.ts`
- Modify: `src/tests/features/GameFeatureRegistry.test.ts`

- [ ] **Step 1: 写 HammerEntity 默认值测试**

```ts
const runtime = createEntityRuntime(world, [HammerEntity]);
runtime.bootstrapSingletons();
const eid = runtime.one(HammerEntity);

expect(HammerComponent.selectedType[eid]).toBe(HammerType.Wood);
expect(HammerComponent.hitTable[eid]).toBe(1);
expect(HammerComponent.hitSeq[eid]).toBe(0);
```

- [ ] **Step 2: 写 HammerProjection 差量测试**

验证：

- 首次 mount 投影 type/thunder，不播放空 hit。
- type 变化只调用 `setHammerType`。
- `touchX/touchY/hitSeq` 变化调用一次 follow + hit。
- `hitTable` 保留 dirty-only row，不调用 view。

- [ ] **Step 3: 实现 HammerEntity**

```ts
export const HammerEntity = defineEntityType({
  name: "hammer",
  cardinality: "one",
  components: [HammerComponent],
  initialize: (eid) => {
    HammerComponent.selectedType[eid] = HammerType.Wood;
    HammerComponent.isThunderActive[eid] = 0;
    HammerComponent.hitTable[eid] = 1;
    HammerComponent.hitCooldownSec[eid] = 0;
    HammerComponent.touchX[eid] = 0;
    HammerComponent.touchY[eid] = 0;
    HammerComponent.hitSeq[eid] = 0;
  },
});
```

- [ ] **Step 4: 实现 HammerProjection**

使用自动 bit row，业务文件不得 import `DirtyComponent` 或 `DirtyFlags`。

- [ ] **Step 5: 改 HammerFeature**

```ts
export const HammerFeature = defineGameFeature({
  name: "hammer",
  entities: [HammerEntity],
  projections: [HammerProjection],
  systems: { state: [updateHammer] },
  setup: ({ entities, views }) => {
    views.mount({
      eid: entities.one(HammerEntity),
      projection: HammerProjection,
      create: () => new HammerNode(),
    });
  },
});
```

- [ ] **Step 6: GameScene 从 EntityRuntime 获取 Hammer eid**

`KickInputAdapterDeps` 将 `singletons` 改为：

```ts
hammerEid: number;
```

`GameScene` 在 Feature setup 后调用：

```ts
const hammerEid = entityRuntime.one(HammerEntity);
```

同时在 `GameScene.init()` 创建并复用同一组 runtime：

```ts
const entityRuntime = createEntityRuntime(world, GAME_FEATURE_REGISTRY.entityTypes());
entityRuntime.bootstrapSingletons();
const projectionRuntime = createProjectionRuntime(GAME_FEATURE_REGISTRY.projections());
```

两者进入兼容版 `FeatureRuntimeContext`，`GameLoopPipeline` 接收同一个 `projectionRuntime`。

Feature setup 完成后执行首次同步：

```ts
projectionRuntime.mark(world);
projectionRuntime.sync(world);
```

- [ ] **Step 7: 避免创建第二个 Hammer singleton**

将 `createSingletonEntities()` 改为接收已经由 EntityRuntime 创建的 hammer eid：

```ts
createSingletonEntities(world, { hammer: entityRuntime.one(HammerEntity) });
```

函数不得再调用 `addEntity()` 创建 Hammer。这样 `hammerSystem` query、输入 adapter 和 projection 指向同一个权威 entity。

- [ ] **Step 8: 停止注册 Hammer 旧同步贡献**

从 `HammerFeature.viewSyncs` 和 `binding/viewSyncs/index.ts` 的业务入口停止使用：

```text
src/binding/viewSyncs/HammerViewSync.ts
src/sync/viewSync/specs/HammerViewSyncSpec.ts
```

文件和旧测试暂时保留到 Task 10，避免迁移中间 commit 因共享 metadata 测试断裂。`DirtyComponent.hammerDirty` 与 Hammer bits 同样在 Task 10 删除。

- [ ] **Step 9: 验证**

Run:

```bash
npm test -- --run src/tests/ecs/HammerSystem.test.ts src/tests/view/KickInputAdapter.test.ts src/tests/sync/CoreViewSync.test.ts src/tests/features
npx tsc --noEmit
```

Expected: PASS。

- [ ] **Step 10: 提交**

```bash
git add src/ecs/gameplay/hammer src/sync/projections/HammerProjection.ts src/features/HammerFeature.ts src/view/GameScene.ts src/view/KickInputAdapter.ts src/tests
git commit -m "refactor: migrate hammer to compiled runtime"
```

---

### Task 7: 迁移 PerfHero 和 Monster pool

**Files:**
- Create: `src/ecs/gameplay/perfHero/PerfHeroEntity.ts`
- Create: `src/ecs/gameplay/monster/MonsterEntity.ts`
- Create: `src/sync/projections/PerfHeroProjection.ts`
- Create: `src/sync/projections/MonsterProjection.ts`
- Modify: `src/ecs/gameplay/monster/MonsterComponent.ts`
- Modify: `src/ecs/gameplay/monster/MonsterFactory.ts`
- Modify: `src/ecs/gameplay/monster/MonsterSystem.ts`
- Modify: `src/features/PerfHeroFeature.ts`
- Modify: `src/features/MonsterFeature.ts`
- Modify: `src/tests/ecs/gameplay/monster/MonsterSystem.test.ts`
- Modify: `src/tests/ecs/PerfHeroSystem.test.ts`
- Modify: `src/tests/sync/FeatureViewSync.test.ts`

- [ ] **Step 1: 将 Monster tracker 改为每条规则一个 entity 的失败测试**

新的 component：

```ts
export const MonsterTriggerComponent = defineComponent({
  ruleIndex: Types.ui16,
  lastMilestone: Types.ui32,
});
```

测试 5 条规则：

```ts
const trackers = createMonsterTriggerEntities(runtime, fiveRules);
expect(trackers).toHaveLength(5);
expect(trackers.map(eid => MonsterTriggerComponent.ruleIndex[eid]))
  .toEqual([0, 1, 2, 3, 4]);
```

- [ ] **Step 2: 实现 PerfHeroEntity 和 MonsterEntity**

两个定义只负责组件安装与字段初始化，不 import Laya、projection 或 view。

- [ ] **Step 3: 实现新 tracker**

删除：

```ts
lastTriggeredMilestone0
lastTriggeredMilestone1
lastTriggeredMilestone2
lastTriggeredMilestone3
```

`monsterSpawnSystem()` 按 `ruleIndex` 找对应规则，读写单个 `lastMilestone`。

- [ ] **Step 4: 实现 pool helper**

```ts
export function createMonsterPool(
  entities: EntityRuntime,
  rules: readonly MonsterSpawnRule[],
): number[] {
  return entities.createMany(MonsterEntity, monsterPoolInputs(rules));
}
```

`monsterPoolInputs` 按 monster type 合计 `maxActiveCount`。

- [ ] **Step 5: 实现两个 projection**

`PerfHeroProjection` 与 `MonsterProjection` 不向 contract 传资源 URL：

```ts
export interface IPerfHeroNode {
  playHero(heroType: number, spawnSeq: number): void;
  setTransform(x: number, y: number, scale: number): void;
}

export interface IMonsterNode {
  spawn(monsterType: number, spawnSeq: number): void;
  setPosition(x: number, y: number): void;
  setScale(scale: number): void;
  setVisible(visible: boolean): void;
}
```

资源映射移动到 `PerfHeroNode`、`MonsterNode`。

- [ ] **Step 6: 迁移 Feature**

`PerfHeroFeature` 自己读取 `getPerfTestRuntimeConfig()`，不再依赖通用 context 的 `perfConfig`。

共享 Spine pool：

```ts
const pool = resources.own(new PerfHeroSpinePoolGroup());
views.mountMany({
  eids,
  projection: PerfHeroProjection,
  create: () => new PerfHeroNode(pool),
});
```

- [ ] **Step 7: 停止注册旧模块**

PerfHeroFeature 和 MonsterFeature 不再声明以下旧模块，但文件保留到 Task 10：

```text
src/binding/viewSyncs/PerfHeroViewSync.ts
src/binding/viewSyncs/MonsterViewSync.ts
src/sync/viewSync/specs/PerfHeroViewSyncSpec.ts
src/sync/viewSync/specs/MonsterViewSyncSpec.ts
```

- [ ] **Step 8: 验证**

Run:

```bash
npm test -- --run src/tests/ecs/PerfHeroSystem.test.ts src/tests/ecs/gameplay/monster/MonsterSystem.test.ts src/tests/sync/FeatureViewSync.test.ts src/tests/view/PerfHeroNode.test.ts src/tests/view/MonsterNode.test.ts
npx tsc --noEmit
```

Expected: PASS。

- [ ] **Step 9: 提交**

```bash
git add src/ecs/gameplay/perfHero src/ecs/gameplay/monster src/sync/projections src/features/PerfHeroFeature.ts src/features/MonsterFeature.ts src/view src/sync/contracts src/tests
git commit -m "refactor: migrate pooled features to entity runtime"
```

---

### Task 8: 迁移 Scene/Hole/Shrew 固定拓扑

**Files:**
- Create: `src/ecs/gameplay/core/CoreEntities.ts`
- Create: `src/sync/projections/CoreProjections.ts`
- Modify: `src/features/CoreGameplayFeature.ts`
- Modify: `src/ecs/world.ts`
- Modify: `src/tests/ecs/WorldFactory.test.ts`
- Modify: `src/tests/ecs/SceneCycleSystem.test.ts`
- Modify: `src/tests/sync/CoreViewSync.test.ts`

- [ ] **Step 1: 写固定拓扑装配测试**

```ts
const result = setupCoreGameplay(context);

expect(result.holes).toHaveLength(HOLE_COUNT);
expect(result.shrews).toHaveLength(HOLE_COUNT);
expect(result.holes.map(eid => HoleComponent.shrewEid[eid]))
  .toEqual(result.shrews);
```

- [ ] **Step 2: 定义实体**

```ts
SceneEntity       cardinality: "one"
HoleEntity        cardinality: "many"
ShrewEntity       cardinality: "many"
```

`ShrewEntity.components` 包含 `ShrewComponent` 和 `AnimationComponent`。

- [ ] **Step 3: 合并 Shrew projection**

`ShrewProjection` 同时 watch `ShrewComponent` 与 `AnimationComponent`，替代 `ShrewViewSync + ShrewAnimationViewSync`。自动 bit 总数必须小于 32。

- [ ] **Step 4: 保留业务拓扑显式**

`CoreGameplayFeature.setup` 仍显式：

1. mount Scene。
2. 创建 9 个 Hole。
3. 每个 Hole 创建一只 Shrew。
4. 写 `HoleComponent.shrewEid`。
5. mount Hole。
6. 以 Hole container 为 parent mount Shrew。

不得将“一个洞对应一只地鼠”隐藏进通用框架 helper。

- [ ] **Step 5: 移除业务 forceFullSync 写入**

从 `SceneCycleSystem` 删除对 `DirtyComponent.forceFullSync` 的写入。场景切换实际修改的 map、position、zIndex、action、animation 字段必须由 projection dirty 比较正常同步。

- [ ] **Step 6: 停止注册旧 Core view sync**

CoreGameplayFeature 不再声明 Shrew/Hole/Scene 对应旧模块。文件保留到 Task 10，届时连同旧 metadata 测试一次删除。

- [ ] **Step 7: 收缩 world.ts**

从 `world.ts` 移除：

```text
createShrewEntity
createHoleEntities
createPerfHeroEntities
createSingletonEntities 中已迁移的 scene/hammer
```

暂时保留 player/network 兼容创建，直到 Task 9/10。保留 `createGameWorld()`；已迁移测试改用 EntityRuntime。

- [ ] **Step 8: 验证**

Run:

```bash
npm test -- --run src/tests/ecs/ShrewStateSystem.test.ts src/tests/ecs/AnimationTimerSystem.test.ts src/tests/ecs/SceneCycleSystem.test.ts src/tests/ecs/HitDetectionSystem.test.ts src/tests/sync/CoreViewSync.test.ts src/tests/features/GameFeatureRegistry.test.ts
npx tsc --noEmit
```

Expected: PASS。

- [ ] **Step 9: 提交**

```bash
git add src/ecs/gameplay/core src/sync/projections/CoreProjections.ts src/features/CoreGameplayFeature.ts src/ecs/world.ts src/tests
git commit -m "refactor: migrate core gameplay topology"
```

---

### Task 9: 迁移 Player HUD 并引入 typed EffectRuntime

**Files:**
- Create: `src/effects/EffectDefinition.ts`
- Create: `src/effects/EffectRuntime.ts`
- Create: `src/ecs/gameplay/hud/PlayerEntity.ts`
- Create: `src/sync/projections/HudProjection.ts`
- Create: `src/effects/HitEffects.ts`
- Create: `src/view/KickResponseAdapter.ts`
- Modify: `src/features/HudFeature.ts`
- Modify: `src/features/FeatureRuntimeContext.ts`
- Modify: `src/features/GameFeatureRuntime.ts`
- Modify: `src/view/GameScene.ts`
- Modify: `src/view/GameLoopPipeline.ts`
- Modify: `src/view/KickInputAdapter.ts`
- Modify: `src/ecs/gameplay/hud/HitResponseSystem.ts`
- Create: `src/tests/effects/HitEffectFlow.test.ts`
- Create: `src/tests/effects/EffectRuntime.test.ts`

- [ ] **Step 1: 写 EffectRuntime 注册、emit、flush、clear 测试**

```ts
const HitRewardEffect = defineEffect<{ shrewIndex: number; reward: number }>("hitReward");
const received: Array<{ shrewIndex: number; reward: number }> = [];
runtime.on(HitRewardEffect, payload => received.push(payload));

runtime.emit(HitRewardEffect, { shrewIndex: 1, reward: 50 });
expect(received).toEqual([]);

runtime.flush();
expect(received).toEqual([{ shrewIndex: 1, reward: 50 }]);
```

`clear()` 必须清空 pending 和 handlers。

- [ ] **Step 2: 写 Hit reward 端到端 Red**

```ts
it("成功回包在 flush 时播放一次奖励表现", () => {
  const effects = createEffectRuntime();
  const shown: Array<{ shrewIndex: number; reward: number }> = [];
  effects.on(HitRewardEffect, payload => shown.push(payload));

  routeKickResponse(world, effects, makeKickResponse());
  expect(shown).toEqual([]);

  effects.flush();
  expect(shown).toEqual([{ shrewIndex: 1, reward: 50 }]);
});
```

Run:

```bash
npm test -- --run src/tests/effects/HitEffectFlow.test.ts
```

Expected: FAIL，`routeKickResponse` / Effect API 尚未实现。

- [ ] **Step 3: 实现显式 typed channel**

禁止字符串全局 event bus：

```ts
export interface EffectDefinition<TPayload> {
  readonly name: string;
  readonly __payload?: TPayload;
}

export function defineEffect<TPayload>(name: string): EffectDefinition<TPayload>;
```

`EffectRuntime` 按 definition identity 保存 handler。队列只在 emit 时分配，属于事件频率成本，不在无事件帧分配。

- [ ] **Step 4: 定义 PlayerEntity 和 PlayerProjection**

Player HUD 使用 projection；`HitComponent` 不再作为持久表现状态。

`createSingletonEntities()` 不再创建第二个 Player entity。兼容 context 的 `singletons.player` 暂时指向 `entityRuntime.one(PlayerEntity)`，Task 10 删除整个兼容字段。

- [ ] **Step 5: 定义 Hit effects**

```ts
export const HitRewardEffect = defineEffect<{
  shrewIndex: number;
  reward: number;
}>("hitReward");

export const HitMissEffect = defineEffect<void>("hitMiss");
```

- [ ] **Step 6: 连接网络回包**

在 `src/view/KickResponseAdapter.ts` 增加纯 orchestration adapter `routeKickResponse(world, effects, resp)`；`hitResponseSystem` 保持返回 reward list。`GameScene` 的 network callback 只调用 adapter：

```ts
const rewards = hitResponseSystem(world, resp);
for (const reward of rewards) {
  effectRuntime.emit(HitRewardEffect, reward);
}
```

如果业务需要 miss，输入 miss adapter 显式 emit `HitMissEffect`；不要通过空 reward 猜测。

`KickInputAdapterDeps` 增加：

```ts
effects: Pick<EffectRuntime, "emit">;
```

miss 分支执行：

```ts
effects.emit(HitMissEffect, undefined);
```

- [ ] **Step 7: HudFeature 注册表现 handler**

```ts
const hitNode = resources.own(createHitEffectNode(root));
effects.on(HitRewardEffect, payload => {
  hitNode.showReward(payload.shrewIndex, payload.reward);
});
effects.on(HitMissEffect, () => hitNode.showMiss());
```

`FeatureRuntimeContext` 在本任务新增稳定能力：

```ts
readonly effects: Pick<EffectRuntime, "on" | "emit">;
```

handler 的取消注册由 context/runtime clear 统一负责，HudFeature 不保存 unsubscribe 数组。

- [ ] **Step 8: 停止注册 HitViewSync**

HudFeature 不再声明 `HitViewSync`。以下旧文件保留到 Task 10：

```text
src/sync/contracts/HitViewContract.ts
src/sync/viewSync/specs/HitViewSyncSpec.ts
src/binding/viewSyncs/HitViewSync.ts
```

- [ ] **Step 9: 主循环 flush**

最终顺序：

```text
state systems
network update
feature systems
projection mark
projection sync
effects flush
```

- [ ] **Step 10: 验证**

Run:

```bash
npm test -- --run src/tests/ecs/HitResponseSystem.test.ts src/tests/view/KickInputAdapter.test.ts src/tests/effects src/tests/sync/HudViewSync.test.ts src/tests/view/GameLoopPipeline.test.ts
npx tsc --noEmit
```

Expected: `HitEffectFlow.test.ts` 从 Red 变为 PASS。

- [ ] **Step 11: 提交**

```bash
git add src/effects src/ecs/gameplay/hud src/sync/projections/HudProjection.ts src/features/HudFeature.ts src/view/GameScene.ts src/tests
git commit -m "feat: route transient hit effects explicitly"
```

---

### Task 10: 删除旧 Dirty/ViewSync 基础设施

**Files:**
- Modify: `src/ecs/components/index.ts`
- Delete: `src/sync/DirtyFlags.ts`
- Delete: `src/sync/dirty/DirtyField.ts`
- Delete: `src/sync/dirty/DirtySchemaRunner.ts`
- Delete: `src/sync/dirty/DirtySchemaTypes.ts`
- Delete: `src/sync/dirty/ViewSyncDirtyAspect.ts`
- Delete: `src/sync/dirty/DirtyMarkSystem.ts`
- Delete: `src/sync/viewSync/ViewSyncModule.ts`
- Delete: `src/sync/viewSync/ViewSyncSpec.ts`
- Delete: `src/binding/ViewSyncBinding.ts`
- Delete: `src/binding/ViewSyncRuntime.ts`
- Delete: `src/binding/SyncView.ts`
- Delete: remaining `src/binding/viewSyncs/**`
- Delete: remaining `src/sync/viewSync/specs/**`
- Modify: `src/features/GameFeature.ts`
- Modify: `src/features/GameFeatureRegistry.ts`
- Modify: `src/view/GameScene.ts`
- Modify: `src/view/GameLoopPipeline.ts`
- Modify/Delete: obsolete tests under `src/tests/binding`, `src/tests/ecs/DirtyMarkSystem.test.ts`, `src/tests/sync/ViewSyncModule.test.ts`

- [ ] **Step 1: 增加禁止业务依赖旧 dirty API 的结构测试**

创建 `src/tests/architecture/FrameworkBoundary.test.ts`：

```ts
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function readTypeScriptTree(root: string): string {
  const chunks: string[] = [];
  for (const name of readdirSync(root)) {
    const path = join(root, name);
    if (statSync(path).isDirectory()) {
      chunks.push(readTypeScriptTree(path));
    } else if (path.endsWith(".ts")) {
      chunks.push(readFileSync(path, "utf8"));
    }
  }
  return chunks.join("\n");
}

it("业务 feature 不导入 DirtyComponent、DirtyFlags 或 ViewSyncModule", () => {
  const sources = [
    readTypeScriptTree("src/features"),
    readTypeScriptTree("src/ecs/gameplay"),
    readTypeScriptTree("src/sync/projections"),
  ].join("\n");
  expect(sources).not.toMatch(/DirtyComponent|DirtyFlags|ViewSyncModule/);
});
```

扫描范围只包含：

```text
src/features
src/ecs/gameplay
src/sync/projections
```

排除 framework compatibility 文件，避免无意义全仓正则。

- [ ] **Step 2: 运行结构测试确认旧依赖仍存在**

Run:

```bash
npm test -- --run src/tests/architecture/FrameworkBoundary.test.ts
```

Expected: FAIL，并列出剩余旧 import。

- [ ] **Step 3: 删除 DirtyComponent**

从 component schema 删除整个 `DirtyComponent`。Entity definitions 不再安装它。`HitComponent` 在 Effect 流程迁移后也删除；若 `NetworkComponent` 仍无生产读写，则在同一任务删除并补结构搜索证据。

- [ ] **Step 4: 删除 compatibility runtime**

`GameScene` 只创建：

```ts
EntityRuntime
ProjectionRuntime
EffectRuntime
FeatureRuntimeContext
```

`GameLoopPipeline` 只调用：

```ts
projectionRuntime.mark(world);
projectionRuntime.sync(world);
effectRuntime.flush();
```

- [ ] **Step 5: 删除 deprecated Feature 字段**

移除：

```text
FeatureSystemEntry
system()
viewSyncs
dirtyAspects()
viewSyncs()
```

Registry 只暴露 entity types、projections、systems 和 setup。

- [ ] **Step 6: 更新生命周期清理**

`GameScene.destroy()`：

```ts
effectRuntime.clear();
projectionRuntime.clear();
featureRuntimeContext.clear();
entityRuntime.clear();
deleteWorld(world);
```

不再调用 `releaseDirtyWorld()`。

- [ ] **Step 7: 删除旧测试并保留行为测试**

删除只验证旧类型形状的测试；保留/迁移：

```text
ProjectionDefinition.test.ts
ProjectionRuntime.test.ts
EntityRuntime.test.ts
FeatureRuntime.test.ts
CoreViewSync.test.ts
FeatureViewSync.test.ts
HudViewSync.test.ts
GameScene.test.ts
```

- [ ] **Step 8: 验证**

Run:

```bash
npm test
npx tsc --noEmit
```

Expected: PASS，结构测试无旧依赖。

- [ ] **Step 9: 提交**

```bash
git add -A
git commit -m "refactor: remove legacy dirty binding runtime"
```

---

### Task 11: 文档、性能和调试验证

**Files:**
- Modify: `AGENTS.md`
- Modify: `.codex/skills/ecs-binding/SKILL.md`
- Modify: `docs/architecture.md`
- Modify: `docs/ecs-binding.md`
- Modify: `docs/test-guide.md`
- Modify: `docs/LayaAir3-Project-Onboarding.md`
- Modify: `docs/ecs-framework-share.html`

- [ ] **Step 1: 更新核心运行流**

统一写为：

```text
GameScene.init
  -> create world
  -> compile EntityRuntime / ProjectionRuntime / EffectRuntime
  -> bootstrap singleton entities
  -> Feature setup creates topology and pools
  -> views.mount marks initial full sync

frame
  -> state systems
  -> network
  -> feature systems
  -> projectionRuntime.mark
  -> projectionRuntime.sync
  -> effectRuntime.flush
```

- [ ] **Step 2: 更新新增业务指南**

新增业务只要求：

1. 定义 component。
2. 定义 EntityType。
3. 写纯 system。
4. 定义 Projection 或 Effect。
5. 在 Feature 中声明 systems/entities/projections，并装配真实业务拓扑。

明确禁止业务直接维护 dirty bit、typed dirty target、registry 和 full sync。

- [ ] **Step 3: 更新项目 skill**

`.codex/skills/ecs-binding/SKILL.md` 改为 projection workflow，并更新测试命令。

- [ ] **Step 4: 全量验证**

Run:

```bash
npm test
npx tsc --noEmit
npm run debug:ready
```

Expected:

- 所有 Vitest 通过。
- TypeScript 无错误。
- debug server 输出 `Debug server already ready` 或成功启动。

- [ ] **Step 5: 运行性能分配检查**

使用现有 perf 模式运行至少 5 分钟，确认：

- 无事件帧 `EffectRuntime` 不产生队列对象。
- `ProjectionRuntime.mark/sync` 不按帧创建 snapshot、row 或 registry 对象。
- entity 数量在运行期稳定。
- FPS、FrameTime、Sprite2DCount 不低于迁移前基线。

记录结果到 `docs/performance-tuning.md`，包含测试 URL、hero 数量、持续时间和前后数据。

- [ ] **Step 6: 提交文档**

```bash
git add AGENTS.md .codex/skills/ecs-binding docs
git commit -m "docs: document compiled feature runtime"
```

---

## 完成标准

- 新 Feature 不需要修改全局 `DirtyComponent` 或 `DirtyFlags`。
- Feature 不接触 registry、dirty array、full sync 和销毁数组。
- `FeatureRuntimeContext` 不含 `singletons`、`perfConfig` 等具体业务字段。
- Hammer/Scene/Player 使用 singleton EntityType。
- Shrew/Hole 保留显式固定拓扑。
- PerfHero/Monster 使用初始化期预创建 pool，运行期不删除 entity。
- Monster trigger 数量不再受四槽 component 限制。
- Hit reward/miss 使用显式 typed effect，不再伪装成持久 dirty state。
- 每帧仍保持 state/network/feature/dirty mark/view sync 的可读顺序。
- 全量测试、类型检查和 debug 构建通过。

## 不在本轮范围

- 自动扫描目录注册 Feature。
- 装饰器和反射式 DI。
- 将所有源码移动到 `src/framework` / `src/game`。
- 通用全局字符串 EventBus。
- 运行期动态安装/卸载 Feature。
- 依赖频繁 `removeEntity` 的动态生命周期。
