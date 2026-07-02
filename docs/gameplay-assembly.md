# 玩法组装设计

本文说明 `game/board`、`game/features/*`、`game/session` 和 `GameFeatures.ts` 的职责边界。它重点回答三个问题：

1. `board` 为什么是基础层，不是普通业务 Feature。
2. 业务 Feature 如何通过 board 协作，但不互相导入内部状态。
3. `session` 如何做跨 Feature 编排，而不是变成业务大脑。

总览职责和生命周期看 `docs/architecture.md`；ECS API 和 Projection / Effect 细节看 `docs/ecs-binding.md`。

## 分层

```text
src/game/board/
  棋盘基础层。拥有 Scene、Hole、BoardPosition、BoardTopology 和 BoardOps。

src/game/features/<name>/
  业务纵向切片。拥有自己的 component、entity、system、projection、node 和公开 API。

src/game/session/
  输入、网络回包、跨 Feature 编排。表达一次用户动作或一次回包如何串起多个 Feature。

src/game/GameFeatures.ts
  组合根。显式汇总 foundation、feature、session setup 和 session systems。
```

依赖方向：

```text
framework
  <- game/board
  <- game/features/*
  <- game/session
  <- app
```

业务 Feature 可以依赖 `game/board` 的公开 API。业务 Feature 之间不能互相导入内部文件。`session` 只依赖各 Feature 的公开 `index.ts`。

## Board Foundation

`board` 是玩法空间，不是普通业务 Feature。它负责稳定、共享、低变化频率的棋盘事实：

- Scene 当前地图。
- 9 个 Hole 的固定拓扑。
- 洞位坐标和 zOrder。
- `residentKind/residentEid` 与 `occupantKind/occupantEid`。
- `BoardPositionComponent`，给 Shrew、Monster 和后续可命中目标提供统一位置事实。

`board` 不知道 Shrew、Monster 的业务规则。它只表达“某个 kind/eid 占用了某个洞位”。

## BoardTopology

`BoardTopology` 只保存当前场景固定 eid：

```ts
export interface BoardTopology {
  readonly scene: number;
  readonly holes: readonly number[];
}
```

它不是服务对象，不保存规则，不拥有生命周期回调。场景进入时由 `BoardFoundation` 创建，场景退出时随 world 和 runtime 一起销毁。

`BoardTopology` 的作用是让运行期代码不用每帧从 world 反查 Scene 和 Hole：

```ts
const board = createBoardTopology(scene, holes);
provide(BoardTopologyCapability, board);
```

## BoardOps

`BoardOps` 是操作 board ECS 状态的无状态函数：

```ts
bindResident(board, index, kind, eid);
tryOccupyTriad(board, triad, kind, eid);
releaseTriadIfOwned(board, triad, kind, eid);
getHoleCenter(board, index);
getHoleEid(board, index);
```

这些函数可以读写 `HoleComponent`，因为它们属于 board 基础层。业务 Feature 不直接写 `HoleComponent.occupant*`，避免半写入和误释放。

## Resident 和 Occupant

Hole 同时保存两类关系：

```text
residentKind / residentEid
  默认住户。当前是 Shrew。

occupantKind / occupantEid
  当前占用者。可能是 resident，也可能是 Monster。
```

Shrew 初始化时绑定 resident：

```ts
bindResident(board, index, BoardOccupantKind.Shrew, shrewEid);
```

Monster 出现时临时占用三洞：

```ts
tryOccupyTriad(board, triad, BoardOccupantKind.Monster, monsterEid);
```

Monster 消失时按 owner 释放：

```ts
releaseTriadIfOwned(board, triad, BoardOccupantKind.Monster, monsterEid);
```

这保证 Shrew 和 Monster 的互斥来自 ECS 权威状态，而不是 view 隐藏。

## Feature 依赖 Board

业务 Feature 可以依赖 `src/game/board/index.ts` 暴露的公开 API：

```ts
import {
  BoardPositionComponent,
  BoardTopologyCapability,
  bindResident,
  tryOccupyTriad,
} from "../../board";
```

业务 Feature 不应依赖另一个业务 Feature 的内部文件：

```ts
// 不允许
import { ShrewComponent } from "../shrew/ShrewComponents";
import { MonsterComponent } from "../monster/MonsterComponents";
```

`board` 是共享基础层；`shrew`、`monster`、`hammer`、`playerHud` 是业务切片。

## ShrewFeature

`ShrewFeature` 负责：

- 创建 Shrew entity。
- 把每个 Shrew 绑定为对应 Hole 的 resident。
- 维护 Shrew 状态机、动画状态和可点击状态。
- 通过 `BoardPositionComponent` 投影位置。

它不负责：

- 创建 Hole。
- 持有 HoleNode。
- 直接写 occupant。
- 知道 Monster 的内部状态。

初始化关系：

```ts
const board = use(BoardTopologyCapability);
for (let index = 0; index < board.holes.length; index++) {
  const shrewEid = entities.create(ShrewEntity, input);
  bindResident(board, index, BoardOccupantKind.Shrew, shrewEid);
  syncShrewBoardPosition(shrewEid, getHoleEid(board, index));
}
```

## MonsterFeature

`MonsterFeature` 负责：

- 创建 Monster 固定池。
- 创建触发 tracker。
- 根据外部提供的里程碑尝试生成 Monster。
- 通过 `BoardOps` 原子占用 triad。
- 维护 Monster 生命周期和释放占用。
- 通过 `BoardPositionComponent` 投影位置。

Monster 需要 board，但不需要知道 `ShrewComponent` 或 `PlayerComponent`。三洞是否可用由 `HoleComponent.occupant*` 决定；money 如何转换成刷怪里程碑由 `session` 提供。

```ts
const triad = findAvailableTriad(board);
if (!triad) return;

spawnMonster(monsterEid, MonsterType.Rhino, triad, board);
```

`spawnMonster` 只有在 `tryOccupyTriad` 成功后才写 Monster 可见状态，避免占位失败却生成半个 Monster。

## Setup-Time Systems

有些 system 需要 setup 阶段能力，例如 Monster system 需要 `BoardTopology`。这类 system 不应该每帧从 world 反查 board，也不应该读全局单例。

`FeatureManifest` 提供 `setupSystems`：

```ts
setupSystems: ctx => {
  const board = ctx.use(BoardTopologyCapability);
  const currentMilestone = ctx.use(MonsterSpawnMilestoneCapability);
  return [
    defineSystem("feature", "monster.spawn", (world, deltaSec) => {
      monsterSpawnSystem(world, board, currentMilestone, deltaSec);
    }),
  ];
}
```

`setupSystems` 生成当前场景的 `GameFeatureRuntime`。场景销毁后，这批 system 闭包随 runtime 一起丢弃，不会持有旧 world 或旧 board。

## Session

`session` 不是 Feature。它不拥有 ECS component，不创建 view，不进入业务切片目录。

`session` 负责把一次外部动作编排成多个 Feature 的公开 API 调用：

- 输入点击：`KickInputController`
- 本地命中：`KickHitDetection`
- 请求构造：`KickRequestMapper`
- 网络回包：`KickResponseHandler`
- 跨 Feature 规则：`HammerThunderSystem`
- 跨 Feature capability：`MonsterSpawnSession`

`session` 可以知道“这次点击要先查 hammer 冷却，再找目标，再触发 shrew 或 monster 命中”。但 `session` 不应该知道：

- `ShrewComponent.hp` 怎么扣。
- `MonsterComponent.holeA/B/C` 怎么写。
- `HammerComponent.hitTable` 怎么维护。
- `PlayerComponent.money` 的底层存储怎么读写。

这些细节由各 Feature 的公开 API 或 system/helper 承担。

## 跨 Feature 业务组装

推荐放置规则：

1. 单个 Feature 内部规则放在 Feature 自己目录。
2. 多个业务 Feature 的一次性协作放在 `session`。
3. 共享空间、拓扑和占用事实放在 `board`。
4. 稳定机制放在 `framework`。
5. Laya 表现细节放在 Node 和 view 层。

示例：点击命中

```text
KickInputController
  -> getHammerHitStatus
  -> detectKickHit
  -> collectShrewKickTargets / collectMonsterKickTargets
  -> applyShrewLocalHit / applyMonsterLocalHit
  -> createKickRequest 或 applyPlayerReward
```

`session` 负责串流程。每个 Feature 负责自己的状态变化。

示例：Monster 金币触发

```text
setupGameSession
  -> provide MonsterSpawnMilestoneCapability
  -> playerMoneyMonsterSpawnMilestone
  -> findPlayer / getPlayerMoney
  -> monsterSpawnSystem(world, board, currentMilestone)
```

Monster 只消费“当前规则的里程碑是多少”。PlayerHUD 只暴露“玩家当前 money 是多少”。money 到 Monster 的业务含义由 `session` 组合。

## GameFeatures 组合根

`GameFeatures.ts` 分三类组合：

```ts
export const GAME_FOUNDATIONS = [
  BoardFoundation,
];

export const GAME_FEATURES = [
  MonsterFeature,
  ShrewFeature,
  HammerFeature,
  PlayerHUDFeature,
  PerfHeroFeature,
];

export const GAME_FEATURE_REGISTRY = createGameFeatureRegistry(GAME_MODULES, {
  setup: setupGameSession,
  systems: GAME_SESSION_SYSTEMS,
});
```

这表达了三个层级：

- foundation 是被业务依赖的基础层。
- feature 是业务能力。
- session setup 提供跨 Feature capability。
- session system 是跨业务编排。

## 边界清单

允许：

- Feature import `game/board/index.ts`。
- `session` import Feature 的公开 `index.ts`。
- Feature 暴露小而明确的意图 API。
- `setupSystems` 捕获 setup capability。
- `setupGameSession` 提供跨 Feature capability。

禁止：

- Feature import 另一个业务 Feature 的内部文件。
- `session` import `*Component` 直接改底层状态。
- 运行期反查 world 重建 board 服务。
- 重新引入 `BoardRuntime` 作为跨 Feature 服务对象。
- view node 反查 ECS。
- 网络回包直接操作 view。

## 新增洞位目标

新增会出现在洞位上的目标，例如 Boss、道具、陷阱：

1. 在自己的 Feature 定义 component、entity、system、projection、node。
2. Entity 组合加入 `BoardPositionComponent`。
3. 通过 `BoardOps` 申请洞位、triad 或后续扩展的占用形态。
4. 命中候选从自己的公开 API 暴露。
5. `session` 只收集候选和调度命中结果。

不要让新目标直接修改其他业务 Feature 的 component。共享的是 board 空间事实，不是业务内部状态。
