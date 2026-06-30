# Board And Monster Hole Occupancy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 先把 `Scene/Map/Hole` 拆成基础 `board` Feature，让 `shrew` 只负责地鼠，再基于 `board` 实现 Monster 三洞占用、金币 100 触发、目标命中和三击奖励。

**Architecture:** `board` 拥有地图、洞位、洞位占用、地图轮换、`SceneLayer/HoleNode` 和可复用 `BoardPositionComponent`。`shrew` 和 `monster` 不持有 `HoleNode`，也不直接维护洞位坐标；它们通过 `BoardPositionComponent` 投影自己的 view，通过 `BoardRuntime` 请求绑定、占用、释放洞位。命中检测比较 Hammer 点击位置和当前可命中的 Shrew/Monster 目标中心，不以 Hole 作为命中入口。

**Tech Stack:** TypeScript, bitecs, LayaAir3, Vitest, existing ECS Feature/Projection/Effect runtime.

---

## Decisions

- 本次重构的第一目标是拆出 `board` Feature。
- 不单独开功能分支；后续执行时直接在当前 `main` 小步 TDD。
- `BoardPositionComponent` 放在 `board` Feature，Shrew、Monster 和后续新目标都可复用。
- `ShrewNode`、`MonsterNode` 挂到 root，由自己的 Projection 设置位置和 zOrder，不再作为 `HoleNode` 子节点。
- 不把 `world` 裸暴露给 `FeatureSetupContext`。新增 `FeatureCapability`，由 `BoardFeature` provide `BoardRuntime`，其他 Feature 通过 `ctx.use(BoardCapability)` 获取受控能力。
- 第一版不做通用 `CreatureEntity`，但通过 `BoardPositionComponent` 和目标命中候选统一 Shrew/Monster 的命中入口。

## Target Module Map

```text
src/game/features/board/
  BoardComponents.ts        SceneComponent / HoleComponent / BoardPositionComponent
  BoardEntities.ts          SceneEntity / HoleEntity
  BoardFeature.ts           创建 Scene 和 9 个 Hole，provide BoardRuntime
  BoardRuntime.ts           BoardCapability、洞位查询、resident/occupant、三洞占用 API
  BoardProjection.ts        SceneProjection / HoleProjection
  BoardTypes.ts             MapType / HOLE_COUNT / BoardOccupantKind
  HolePositions.ts          洞位坐标、grid、zOrder
  MapCycleSystem.ts         地图计时、切图、洞位坐标更新
  SceneConfig.ts            地图循环配置
  SceneLayer.ts             背景和 cover
  HoleNode.ts               洞位容器表现
  ISceneLayer.ts
  IHoleNode.ts
  index.ts

src/game/features/shrew/
  ShrewComponents.ts        ShrewComponent / AnimationComponent
  ShrewEntities.ts          ShrewEntity includes BoardPositionComponent
  ShrewFeature.ts           创建 Shrew，注册为 board resident，mount ShrewNode 到 root
  ShrewBoardSyncSystem.ts   从 BoardRuntime 同步 BoardPositionComponent
  ShrewProjection.ts        读 ShrewComponent + BoardPositionComponent
  ...

src/game/features/monster/
  MonsterHoleTriads.ts      合法三角形和中心计算
  MonsterComponents.ts      MonsterComponent / MonsterSpawnComponent
  MonsterEntities.ts        MonsterEntity includes BoardPositionComponent
  MonsterSystems.ts         金币触发、挂起刷新、三洞占用、释放
  MonsterProjection.ts      读 MonsterComponent + BoardPositionComponent
  ...
```

## Core Types

### Feature Capability

```ts
export interface FeatureCapability<T> {
  readonly name: string;
}

export function defineCapability<T>(name: string): FeatureCapability<T> {
  return { name };
}
```

`FeatureSetupContext` adds:

```ts
provide<T>(capability: FeatureCapability<T>, value: T): void;
use<T>(capability: FeatureCapability<T>): T;
```

### Board Components

```ts
export const enum BoardOccupantKind {
  Empty = 0,
  Shrew = 1,
  Monster = 2,
}

export const SceneComponent = defineComponent({
  currentMap: Types.f32,
  sceneTimer: Types.f32,
  cycleInterval: Types.f32,
  transitioning: Types.f32,
});

export const HoleComponent = defineComponent({
  index: Types.f32,
  gridRow: Types.f32,
  gridCol: Types.f32,
  posXRatio: Types.f32,
  posYRatio: Types.f32,
  residentKind: Types.f32,
  residentEid: Types.f32,
  occupantKind: Types.f32,
  occupantEid: Types.f32,
  zIndex: Types.f32,
});

export const BoardPositionComponent = defineComponent({
  xRatio: Types.f32,
  yRatio: Types.f32,
  zIndex: Types.f32,
});
```

### Board Runtime

```ts
export interface BoardRuntime {
  readonly holes: readonly number[];
  currentMap(): MapType;
  getHoleEid(index: number): number;
  getHoleIndex(holeEid: number): number;
  getHoleCenter(index: number): { xRatio: number; yRatio: number };
  getHoleZOrder(index: number): number;
  bindResident(index: number, kind: BoardOccupantKind, eid: number): void;
  restoreResident(index: number): void;
  canOccupyTriad(triad: readonly [number, number, number]): boolean;
  occupyTriad(triad: readonly [number, number, number], kind: BoardOccupantKind, eid: number): void;
  releaseTriad(triad: readonly [number, number, number]): void;
}
```

## Task 1: Feature Capability Registry

**Files:**
- Modify: `src/framework/feature/FeatureSetupContext.ts`
- Modify: `src/framework/feature/FeatureManifest.ts` if type exports are preferred there
- Test: `src/tests/features/GameFeatureRegistry.test.ts`

- [ ] **Step 1: Write failing capability test**

Add to `src/tests/features/GameFeatureRegistry.test.ts`:

```ts
it("shares typed setup capabilities between features", () => {
  const TestCapability = defineCapability<{ value: number }>("test.capability");
  const world = createGameWorld();
  const entities = createEntityRuntime(world, []);
  const setup = createSetupContext(entities);

  setup.context.provide(TestCapability, { value: 7 });

  expect(setup.context.use(TestCapability).value).toBe(7);
});
```

- [ ] **Step 2: Run failing test**

Run:

```bash
npm test -- src/tests/features/GameFeatureRegistry.test.ts
```

Expected: FAIL because `defineCapability/provide/use` do not exist.

- [ ] **Step 3: Implement minimal capability registry**

In `FeatureSetupContext.ts`, add a `Map<FeatureCapability<any>, any>` inside `createFeatureSetupContext` and expose:

```ts
provide: (capability, value) => {
  capabilities.set(capability, value);
},
use: capability => {
  if (!capabilities.has(capability)) {
    throw new Error(`Feature capability is not provided: ${capability.name}`);
  }
  return capabilities.get(capability);
},
```

Update test mock `createSetupContext` with the same behavior.

- [ ] **Step 4: Run focused test**

Run:

```bash
npm test -- src/tests/features/GameFeatureRegistry.test.ts
```

Expected: PASS.

## Task 2: Extract Board Feature Skeleton

**Files:**
- Create: `src/game/features/board/BoardTypes.ts`
- Create: `src/game/features/board/BoardComponents.ts`
- Create: `src/game/features/board/BoardEntities.ts`
- Create: `src/game/features/board/HolePositions.ts`
- Create: `src/game/features/board/SceneConfig.ts`
- Create: `src/game/features/board/BoardProjection.ts`
- Create: `src/game/features/board/SceneLayer.ts`
- Create: `src/game/features/board/HoleNode.ts`
- Create: `src/game/features/board/ISceneLayer.ts`
- Create: `src/game/features/board/IHoleNode.ts`
- Create: `src/game/features/board/index.ts`
- Modify: `src/game/features/shrew/*` imports temporarily through board public exports
- Test: existing board-related tests moved or retargeted

- [ ] **Step 1: Move board-owned symbols**

Move these without behavior changes:

```text
MapType, HOLE_COUNT             -> board/BoardTypes.ts
SceneComponent, HoleComponent   -> board/BoardComponents.ts
SceneEntity, HoleEntity         -> board/BoardEntities.ts
HolePositions, getHoleGrid      -> board/HolePositions.ts
getHoleZOrder                   -> board/HolePositions.ts
SceneConfig                     -> board/SceneConfig.ts
SceneLayer, ISceneLayer         -> board/
HoleNode, IHoleNode             -> board/
SceneProjection, HoleProjection -> board/BoardProjection.ts
```

Leave `ShrewType` and `ShrewAction` in `shrew/ShrewTypes.ts`.

- [ ] **Step 2: Keep compatibility exports during migration**

For the first step, `src/game/features/shrew/index.ts` may re-export board symbols to keep tests compiling:

```ts
export {
  HOLE_COUNT,
  MapType,
  HoleComponent,
  SceneComponent,
  HoleEntity,
  SceneEntity,
} from "../board";
```

This is temporary. Remove these re-exports after tests import from `board` directly.

- [ ] **Step 3: Run moved-symbol tests**

Run:

```bash
npm test -- src/tests/ecs/WorldFactory.test.ts src/tests/sync/CoreViewSync.test.ts src/tests/view/SceneLayer.test.ts
```

Expected: PASS after imports are updated or compatibility exports are in place.

## Task 3: BoardRuntime And BoardFeature

**Files:**
- Create: `src/game/features/board/BoardRuntime.ts`
- Create: `src/game/features/board/BoardFeature.ts`
- Modify: `src/game/GameFeatures.ts`
- Modify: `src/game/features/shrew/ShrewFeature.ts`
- Test: `src/tests/features/GameFeatureRegistry.test.ts`
- Test: `src/tests/architecture/ExplicitFeatureRegistration.test.ts`

- [ ] **Step 1: Write failing registration test**

Update `GameFeatureRegistry.test.ts`:

```ts
expect(GAME_FEATURES.map(feature => feature.name).slice(0, 2)).toEqual([
  "board",
  "shrew",
]);
expect(GAME_FEATURE_REGISTRY.entityTypes()).toEqual(expect.arrayContaining([
  SceneEntity,
  HoleEntity,
  ShrewEntity,
]));
```

- [ ] **Step 2: Implement BoardRuntime**

`BoardRuntime` should wrap the created scene and holes:

```ts
export const BoardCapability = defineCapability<BoardRuntime>("board");

export function createBoardRuntime(holes: readonly number[]): BoardRuntime {
  return {
    holes,
    currentMap: () => current scene map,
    getHoleEid: index => holes[index],
    getHoleIndex: holeEid => Math.round(HoleComponent.index[holeEid]),
    getHoleCenter: index => {
      const eid = holes[index];
      return {
        xRatio: HoleComponent.posXRatio[eid],
        yRatio: HoleComponent.posYRatio[eid],
      };
    },
    getHoleZOrder: index => HoleComponent.zIndex[holes[index]],
    bindResident: (index, kind, eid) => { ... },
    restoreResident: index => { ... },
    canOccupyTriad: triad => triad.every(index => HoleComponent.occupantKind[holes[index]] === HoleComponent.residentKind[holes[index]]),
    occupyTriad: (triad, kind, eid) => { ... },
    releaseTriad: triad => { for each index restoreResident(index); },
  };
}
```

- [ ] **Step 3: Implement BoardFeature**

`BoardFeature`:
- creates `SceneEntity`
- creates 9 `HoleEntity`
- mounts `SceneLayer`
- mounts 9 `HoleNode`
- provides `BoardCapability`

Use existing `mountSingleton` and `mountPool` where possible.

- [ ] **Step 4: Update GameFeatures**

Order:

```ts
export const GAME_FEATURES = [
  BoardFeature,
  ShrewFeature,
  HammerFeature,
  PlayerHUDFeature,
  SessionFeature,
  PerfHeroFeature,
  MonsterFeature,
];
```

- [ ] **Step 5: Run focused feature tests**

Run:

```bash
npm test -- src/tests/features/GameFeatureRegistry.test.ts src/tests/architecture/ExplicitFeatureRegistration.test.ts
```

Expected: PASS.

## Task 4: Shrink Shrew Feature And Add BoardPosition

**Files:**
- Modify: `src/game/features/shrew/ShrewComponents.ts`
- Modify: `src/game/features/shrew/ShrewEntities.ts`
- Modify: `src/game/features/shrew/ShrewFeature.ts`
- Create: `src/game/features/shrew/ShrewBoardSyncSystem.ts`
- Modify: `src/game/features/shrew/ShrewProjection.ts`
- Modify: `src/game/features/shrew/ShrewNode.ts`
- Modify: `src/game/features/shrew/IShrewNode.ts`
- Test: `src/tests/game/features/shrew/ShrewStateSystem.test.ts`
- Test: `src/tests/sync/CoreViewSync.test.ts`

- [ ] **Step 1: Add BoardPositionComponent to ShrewEntity**

`ShrewEntity` components become:

```ts
components: [ShrewComponent, AnimationComponent, BoardPositionComponent]
```

`ShrewComponent` gets:

```ts
holeIndex: Types.f32
```

- [ ] **Step 2: ShrewFeature uses BoardCapability**

`ShrewFeature.setup` should:
- `const board = ctx.use(BoardCapability)`
- create one Shrew per board hole
- set `ShrewComponent.holeIndex`
- call `board.bindResident(index, BoardOccupantKind.Shrew, shrewEid)`
- mount `ShrewNode` under root, not under `HoleNode`

- [ ] **Step 3: Add ShrewBoardSyncSystem**

```ts
export function shrewBoardSyncSystem(world: any, board: BoardRuntime): void {
  for each shrew:
    const index = ShrewComponent.holeIndex[shrew];
    const center = board.getHoleCenter(index);
    BoardPositionComponent.xRatio[shrew] = center.xRatio;
    BoardPositionComponent.yRatio[shrew] = center.yRatio;
    BoardPositionComponent.zIndex[shrew] = board.getHoleZOrder(index);
}
```

If systems cannot receive `BoardRuntime` directly, create the system closure in `ShrewFeature.setup` and register it through a later manifest extension, or first keep a pure helper and call it from an existing Shrew system. Prefer the smallest compileable path.

- [ ] **Step 4: ShrewProjection reads BoardPositionComponent**

Add projection rows:

```ts
watch(boardPositionSource, ["xRatio", "yRatio"], "shrew board position", ({ eid, node }) => {
  node.setPosition(BoardPositionComponent.xRatio[eid], BoardPositionComponent.yRatio[eid]);
});
watch(boardPositionSource, ["zIndex"], "shrew board z-order", ({ eid, node }) => {
  node.setZOrder(BoardPositionComponent.zIndex[eid]);
});
```

Extend `IShrewNode` and `ShrewNode` with `setPosition` and `setZOrder`.

- [ ] **Step 5: Remove Shrew-owned Scene/Hole setup**

`ShrewFeature` no longer imports:

```text
SceneEntity
HoleEntity
SceneLayer
HoleNode
SceneProjection
HoleProjection
mapCycleSystem
```

- [ ] **Step 6: Run shrew and sync tests**

Run:

```bash
npm test -- src/tests/game/features/shrew src/tests/sync/CoreViewSync.test.ts src/tests/features/GameFeatureRegistry.test.ts
```

Expected: PASS.

## Task 5: Move Map Cycle To Board

**Files:**
- Create/Modify: `src/game/features/board/MapCycleSystem.ts`
- Modify: `src/game/features/shrew/ShrewAnimationTimerSystem.ts`
- Create: `src/game/features/shrew/ShrewMapSyncSystem.ts`
- Test: `src/tests/game/features/board/MapCycleSystem.test.ts`
- Test: `src/tests/game/features/shrew/ShrewAnimationTimerSystem.test.ts`

- [ ] **Step 1: Board owns scene timer and hole coordinate updates**

Move current map cycle behavior to `board/MapCycleSystem.ts`:
- increment `SceneComponent.sceneTimer`
- switch `SceneComponent.currentMap`
- update hole `posXRatio/posYRatio/zIndex`
- restore hole occupants to residents on map switch

- [ ] **Step 2: ShrewAnimationTimerSystem only advances animation**

Remove `SceneComponent` query from `ShrewAnimationTimerSystem`.

- [ ] **Step 3: Add ShrewMapSyncSystem**

Shrew responds to board map changes:

```ts
if (ShrewComponent.mapType[eid] !== board.currentMap()) {
  resetShrewForNextCycle(eid);
  ShrewComponent.mapType[eid] = board.currentMap();
}
```

- [ ] **Step 4: Run map tests**

Run:

```bash
npm test -- src/tests/game/features/board/MapCycleSystem.test.ts src/tests/game/features/shrew/ShrewAnimationTimerSystem.test.ts
```

Expected: PASS.

## Task 6: Monster Triads And BoardPosition

**Files:**
- Create: `src/game/features/monster/MonsterHoleTriads.ts`
- Modify: `src/game/features/monster/MonsterComponents.ts`
- Modify: `src/game/features/monster/MonsterEntities.ts`
- Modify: `src/game/features/monster/MonsterFeature.ts`
- Test: `src/tests/game/features/monster/MonsterTriads.test.ts`
- Test: `src/tests/game/features/monster/MonsterSystem.test.ts`

- [ ] **Step 1: Add triad topology tests**

Test legal triads:

```ts
expect(MONSTER_HOLE_TRIADS).toEqual([
  [0, 1, 3], [0, 1, 4], [0, 3, 4], [1, 3, 4],
  [1, 2, 4], [1, 2, 5], [1, 4, 5], [2, 4, 5],
  [3, 4, 6], [3, 4, 7], [3, 6, 7], [4, 6, 7],
  [4, 5, 7], [4, 5, 8], [4, 7, 8], [5, 7, 8],
]);
```

- [ ] **Step 2: MonsterEntity includes BoardPositionComponent**

`MonsterEntity` components:

```ts
components: [MonsterComponent, BoardPositionComponent]
```

`MonsterComponent` stores triad/hp/reward/state, not authoritative position.

- [ ] **Step 3: Monster spawn writes BoardPositionComponent**

When spawning:

```ts
const center = getMonsterTriadCenter(triad, board);
BoardPositionComponent.xRatio[monster] = center.xRatio;
BoardPositionComponent.yRatio[monster] = center.yRatio;
BoardPositionComponent.zIndex[monster] = MONSTER_Z_ORDER;
board.occupyTriad(triad, BoardOccupantKind.Monster, monster);
```

- [ ] **Step 4: Run monster topology tests**

Run:

```bash
npm test -- src/tests/game/features/monster/MonsterTriads.test.ts src/tests/game/features/monster/MonsterSystem.test.ts
```

Expected: PASS.

## Task 7: Target-Based Hit Detection

**Files:**
- Modify: `src/game/session/KickHitDetection.ts`
- Modify: `src/game/session/KickInputController.ts`
- Modify: `src/game/features/playerHud/PlayerSystems.ts`
- Test: `src/tests/game/session/KickHitDetection.test.ts`
- Test: `src/tests/game/session/KickInputController.test.ts`

- [ ] **Step 1: Hit detection reads BoardPositionComponent**

Candidate rules:
- Shrew candidate: `ShrewComponent.isClickable === 1` and its board resident hole is not occupied by Monster.
- Monster candidate: `MonsterComponent.visible === 1` and `MonsterComponent.hp > 0`.
- Candidate center always comes from `BoardPositionComponent.xRatio/yRatio`.
- Pick closest candidate within hit radius.
- No hard-coded Monster-first priority.

- [ ] **Step 2: Monster hit handling**

On Monster hit:
- `hp -= 1`
- `hitSeq += 1`
- at `hp <= 0`: `defeatedSeq += 1`, add 30 money, release triad after defeated flow.

- [ ] **Step 3: Run session tests**

Run:

```bash
npm test -- src/tests/game/session/KickHitDetection.test.ts src/tests/game/session/KickInputController.test.ts
```

Expected: PASS.

## Task 8: Projection, Docs, Full Verification

**Files:**
- Modify: `src/game/features/monster/MonsterProjection.ts`
- Modify: `src/game/features/monster/MonsterNode.ts`
- Modify: `docs/architecture.md`
- Modify: `docs/ecs-binding.md`

- [ ] **Step 1: MonsterProjection reads BoardPositionComponent**

Projection rows:
- `BoardPositionComponent.xRatio/yRatio` -> `node.setPosition`
- `BoardPositionComponent.zIndex` -> `node.setZOrder`
- `MonsterComponent.spawnSeq` -> drop from air
- `MonsterComponent.hitSeq` -> hit feedback
- `MonsterComponent.defeatedSeq` -> play defeated Spine

- [ ] **Step 2: Update docs**

Document:
- `board` owns Scene/Map/Hole and `BoardPositionComponent`
- Shrew/Monster use `BoardRuntime` and `BoardPositionComponent`
- hit detection compares Hammer touch with Shrew/Monster target centers

- [ ] **Step 3: Run verification**

Run:

```bash
npx tsc --noEmit
npm test
npm run debug:ready
```

Expected: all commands exit 0.

- [ ] **Step 4: Commit on main**

```bash
git add src/game/features/board src/game/features/shrew src/game/features/monster src/game/session src/game/features/playerHud src/tests docs
git commit -m "feat: 拆分 Board Feature 并实现 Monster 三洞占用" \
  -m "TDD Red: 增加 board 能力、BoardPosition、三角形占用和目标命中相关失败测试。" \
  -m "TDD Green: 抽出 board Feature，Shrew/Monster 复用 BoardPositionComponent，并实现 Monster 三洞占用与三击奖励。" \
  -m "TDD Refactor: Shrew/Monster 不再依赖 HoleNode，命中检测比较 Hammer 与目标中心。"
```

## Risks

- 这是一次边界重构，不是单纯 Monster 功能。需要先保证 `board` 抽出后现有 Shrew 行为不变，再实现 Monster。
- `FeatureCapability` 不要变成通用 Service Locator。第一版只提供 `BoardCapability`，后续有明确 Feature 依赖再增加。
- `BoardPositionComponent` 是 view 锚点缓存，不是 Shrew/Monster 的业务权威位置。只有 board sync 或 spawn/release 系统能写它。
- `ShrewNode` 挂 root 后，zOrder 必须测试覆盖，否则可能出现遮罩/层级变化。

## Self Review

- Spec coverage: 覆盖拆出 `board` Feature、`BoardPositionComponent` 复用、Shrew 变小、Monster 三洞占用、金币 100 触发、可用三角形等待、Hammer 与目标中心比较命中、三击奖励和不分支实施。
- Placeholder scan: 没有 `TODO`、`TBD`、`similar to above`。
- Type consistency: `BoardRuntime`、`BoardCapability`、`BoardPositionComponent`、`BoardOccupantKind`、`MonsterHoleTriad`、`pendingSpawn` 在任务中命名一致。
