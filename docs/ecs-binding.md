# ECS、Projection 与 Effect

本文记录 ECS 绑定层 API、修改步骤和排查方法。目录结构、运行流和 Feature 边界见 `docs/architecture.md`。

## 权威状态

权威状态保存在 bitecs component typed arrays。Laya 节点实现本业务切片内的接口文件，例如 `IPlayerHUD.ts`、`IHammerNode.ts`、`IMonsterNode.ts`。Node 不反查 ECS，也不维护规则状态。

`board` 是 Scene/Map/Hole 的权威 Feature：

- `HoleComponent.residentKind/residentEid` 表示洞位默认住户，例如 Shrew。
- `HoleComponent.occupantKind/occupantEid` 表示当前占用者，例如 Monster 临时占用三个洞。
- `BoardPositionComponent` 表示挂在 root 下的业务目标位置和 zOrder；Shrew、Monster 和后续新目标都应复用它。
- 其他 Feature 通过 `BoardCapability` / `BoardRuntime` 绑定、占用或释放洞位，不直接导入 board 内部文件。

## EntityDefinition

EntityDefinition 声明组件组合、基数和初始化：

```ts
export const PlayerEntity = defineEntity({
  name: "player",
  components: [PlayerComponent],
  cardinality: "one",
  initialize(eid) {
    PlayerComponent.money[eid] = 0;
  },
});
```

- `one`：由 `bootstrapSingletons()` 创建，通过 `entities.one(type)` 获取。
- `many`：通过 `create/createMany` 创建固定拓扑或对象池。
- 初始化发生在进场阶段，可以优先可读性和封装。
- 运行期通常不 `removeEntity`；用 `visible/state/ageSec/spawnSeq` 等字段复用槽位。

## ProjectionDefinition

Projection 声明“哪些 component 字段变化时调用哪个 `I*` 接口方法”：

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
- row bit、dirty array、full sync 都是 runtime 私有机制，业务不可见。
- 规则字段需要比较但不直接更新 view 时使用 `noProjection`。
- 多行共用同一个 apply 函数时，单帧会去重。
- 单个 Projection 最多 32 rows。

## ProjectionRuntime

`mark(world)`：

1. 遍历预编译 query。
2. 首次看到 eid 时创建 snapshot，并标记全部 rows。
3. 后续只比较 flattened fields。
4. 把变化写入 runtime 私有 dirty arrays。

`sync(world)`：

1. 查 eid 对应 node。
2. 执行变化 rows。
3. 清零 dirty/full arrays。

Feature mount 会触发初始化 full sync；业务不写 `forceFullSync`。

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

Effect 按 definition 对象身份隔离。`emit` 只入队，主循环最后 `flush()`。

## 修改步骤

新增持久可见字段：

1. 在 component 增加字段，并在 EntityDefinition 初始化。
2. 由 system/helper 修改字段。
3. 在对应 `I*` 接口文件增加方法，例如 `IShrewNode.ts`。
4. 在对应 Projection 增加或修改 `watch` row。
5. 在 view node 实现方法。
6. 补 ProjectionRuntime 或业务投影测试。

新增会出现在洞位上的目标：

1. Entity 组合里加入 `BoardPositionComponent`。
2. Feature setup 或 system 通过 `BoardRuntime` 选择洞位、绑定 resident 或占用 triad。
3. 同步 `BoardPositionComponent.xRatio/yRatio/zIndex`，Projection 只读该组件做 view 定位。
4. 命中检测比较 Hammer 触点和目标中心，不把 HoleNode 当作业务命中入口。

新增瞬时效果：

1. 在拥有该事实的业务切片定义 typed EffectDefinition。
2. adapter/system emit 同一个 definition identity。
3. Feature setup 注册 handler。
4. effect node 通过 `createView/own` 交给 ViewRegistry 管理。
5. 补 EffectRuntime 或效果流测试。

## 排查

ECS 数据变了但画面不变：

1. system 是否改了正确 component/eid。
2. Projection 是否包含该 component 和字段。
3. Feature 是否声明该 Projection。
4. Feature setup 是否 mount 正确 eid/node。
5. `I*` 接口方法是否被具体 Node 正确实现。
6. async resource callback 是否被 stale guard 拦截。

瞬时效果不显示：

1. 是否 emit 正确 EffectDefinition。
2. handler 是否注册在同一个 definition identity 上。
3. `GameLoopPipeline` 是否执行 `effects.flush()`。
4. effect node 是否已创建并归 ViewRegistry 所有。

## 测试

```bash
npm test -- --run src/tests/ecs/EntityRuntime.test.ts
npm test -- --run src/tests/sync/ProjectionDefinition.test.ts src/tests/sync/ProjectionRuntime.test.ts
npm test -- --run src/tests/sync/CoreViewSync.test.ts src/tests/sync/FeatureViewSync.test.ts
npm test -- --run src/tests/effects
npm test -- --run src/tests/architecture/FrameworkBoundary.test.ts
```
