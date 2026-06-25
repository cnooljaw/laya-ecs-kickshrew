# ECS、Projection 与 Effect

## 权威状态

权威游戏数据保存在 bitecs component typed arrays 中。主要组件：

- `ShrewComponent` / `AnimationComponent`
- `HoleComponent`
- `SceneComponent`
- `HammerComponent`
- `PlayerComponent`
- `MonsterComponent` / `MonsterSpawnComponent`
- `PerfHeroComponent`

Laya 节点只实现 `src/sync/contracts/*ViewContract.ts`。

## EntityType

EntityType 声明组件组合、基数和初始化：

```ts
export const PlayerEntity = defineEntityType({
  name: "player",
  components: [PlayerComponent],
  cardinality: "one",
  initialize(eid) {
    PlayerComponent.money[eid] = 0;
  },
});
```

- `one`：由 `bootstrapSingletons()` 创建并通过 `entities.one(type)` 获取。
- `many`：通过 `create/createMany` 创建固定拓扑或池。
- 初始化发生在进场阶段，可以优先可读性和封装，不为这段代码牺牲边界。

## ProjectionDefinition

Projection 声明“哪些字段变化时调用哪个 view contract 方法”：

```ts
const source = projectionSource("player", PlayerComponent);

export const PlayerProjection = defineProjection<IPlayerHUD>({
  name: "player",
  components: [PlayerComponent],
  rows: [
    watch(source, ["money"], "player money", ({ eid, node }) => {
      node.setMoney(PlayerComponent.money[eid]);
    }),
    watch(source, ["power", "powerTop"], "player power", ({ eid, node }) => {
      node.setPower(PlayerComponent.power[eid], PlayerComponent.powerTop[eid]);
    }),
  ],
});
```

规则：

- `components` 决定 bitecs query。
- `watch` 字段决定 snapshot 比较范围。
- row bit 由框架自动分配，业务不可见。
- 规则字段需要被比较但不直接更新 view 时使用 `noProjection`。
- 多行共用同一个 apply 函数时，单帧会去重。
- 单个 Projection 最多 32 rows。

## ProjectionRuntime

`mark(world)`：

1. 遍历预编译 query。
2. 首次创建 eid snapshot，并标记全部 rows。
3. 后续只比较 flattened fields。
4. 把变化记录到 runtime 私有 `Uint32Array`。

`sync(world)`：

1. 查 eid 对应 node。
2. 执行变化 rows。
3. 清零 runtime 私有 dirty/full arrays。

初始化 mount 会设置 runtime 私有 full sync。业务不写 `forceFullSync`。

## EffectRuntime

持久状态使用 Projection；瞬时事实使用 Effect：

```ts
export const HitRewardEffect = defineEffect<{
  shrewIndex: number;
  reward: number;
}>("hitReward");
```

```ts
effects.emit(HitRewardEffect, payload);
effects.on(HitRewardEffect, payload => hitNode.showReward(...));
```

Effect 按 definition 对象身份隔离。`emit` 不立即执行 handler，主循环最后 `flush()`。

## Feature 装配

```ts
export const MonsterFeature = defineGameFeature({
  name: "monster",
  entities: [MonsterEntity, MonsterTriggerEntity],
  projections: [MonsterProjection],
  systems: { feature: [monsterLifetimeSystem, monsterSpawnSystem] },
  setup: ({ entities, views }) => {
    const eids = createMonsterPool(entities, MONSTER_SPAWN_RULES);
    views.mountMany({
      eids,
      projection: MonsterProjection,
      create: () => new MonsterNode(),
    });
  },
});
```

Feature 不维护 registry、unsubscribe 数组或销毁列表。runtime context 统一处理。

## 新增可见字段

1. 在 component 增加字段并在 EntityType 初始化。
2. 由 system/helper 修改字段。
3. 在 view contract 增加方法。
4. 在对应 Projection 增加/修改 `watch` row。
5. 在 view node 实现方法。
6. 补 ProjectionRuntime/业务投影测试。

## 新增独立玩法

推荐结构：

```text
src/ecs/gameplay/foo/FooComponent.ts
src/ecs/gameplay/foo/FooEntity.ts
src/ecs/gameplay/foo/FooSystem.ts
src/sync/contracts/FooViewContract.ts
src/sync/projections/FooProjection.ts
src/view/FooNode.ts
src/features/FooFeature.ts
```

运行期实体优先预创建并通过 `visible/state/ageSec` 复用。Monster 和 PerfHero 都使用该策略。

## 排查

ECS 数据变了但画面不变：

1. system 是否改了正确 component/eid。
2. Projection 是否包含该 component 和字段。
3. Feature 是否声明该 Projection。
4. Feature setup 是否 mount 正确 eid/node。
5. view contract 方法是否被具体 Node 正确实现。
6. 异步资源回调是否被 stale guard 拦截。

瞬时效果不显示：

1. adapter 是否 emit 正确 EffectDefinition。
2. Feature 是否对同一个 definition identity 注册 handler。
3. GameLoopPipeline 是否执行 `effects.flush()`。
4. effect node 是否已由 `views.create` 创建并归 ViewRegistry 所有。

## 测试

```bash
npm test -- --run src/tests/ecs/EntityRuntime.test.ts
npm test -- --run src/tests/sync/ProjectionDefinition.test.ts src/tests/sync/ProjectionRuntime.test.ts
npm test -- --run src/tests/sync/CoreViewSync.test.ts src/tests/sync/FeatureViewSync.test.ts
npm test -- --run src/tests/effects
npm test -- --run src/tests/architecture/FrameworkBoundary.test.ts
```
