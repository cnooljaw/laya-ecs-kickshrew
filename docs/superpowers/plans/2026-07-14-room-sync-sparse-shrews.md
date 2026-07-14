# 3 人房间同步、权威地图与稀疏地鼠开局 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让同一 3 人房间的客户端渲染同一条服务端权威时间线，包括地鼠产生、状态间隔和地图切换；未满的新房保持草地空场，满房后以单只地鼠开始，并在相同服务端时刻切换同一张地图。

**Architecture:** `RoomActor` 继续按 3 人分配 `AttackActor`，但 `AttackActor` 增加 `Filling` 和 `Running` 两个房间阶段，并同时拥有 `ShrewTimeline` 与 `MapTimeline`。前者不再为九个洞位预建周期，只保存服务端选中的活跃周期；后者保存当前地图、版本号和下一次切图的绝对服务端时间。快照是房间完整基线，地图边界另以组播推送纠偏；客户端使用同一个 RTT 校正后的服务端时钟自行跨越 `next_switch_ms`，不等待 500ms 快照轮询才切图。

**Tech Stack:** Go 1.23、Gorilla WebSocket、protobuf、TypeScript、bitecs、Vitest。

---

## 现状与规则

- 现有 `RoomActor.pickAttack()` 将连续连接按 `RoomSize=3` 分配：第 1 至第 3 个客户端进入同一个 `AttackActor`，第 4 个客户端开始新的 `AttackActor`。`broadcast()` 仅发送给当前 `AttackActor.players`，因此它是**按 3 人房间组播**，不同组本来就不应同步。
- 现有 `NewShrewTimeline()` 在房间创建时为 9 个洞全部创建首轮周期，所以一个新组尚未开始也有 9 只待出现的地鼠。
- 本计划固定以下首版规则：`RoomSize=3`、`MinPlayersToStart=3`、`InitialActiveShrews=1`、`MaxActiveShrews=1`、`InterSpawnMS=800`。未满 3 人不生成地鼠；第 3 人加入后，服务器在统一的 `start_at_ms` 后生成 1 只；每轮结束或被击中后最多补 1 只。
- 地图首版规则：`MapCycleMS=16000`，顺序固定为 `Meadow -> Ship -> Space -> Meadow`。每个新 `AttackActor` 在 `Filling` 阶段显示 `Meadow`，且没有待切换地图；第 3 人满房时，以同一个 `start_at_ms` 启动地图时间线。随后同房客户端在相同的绝对服务端毫秒切换地图，不同 `AttackActor` 互不影响。
- `GameSnapshot.active_cycles` 语义改为“本房间所有活跃地鼠的完整集合”，不是增量。客户端不能让未出现在该集合中的槽位继续本地随机循环。
- `GameSnapshot.map_timeline` 是入场、重连和丢包后的完整地图基线；`MapStatePush` 只用于地图变化时的同房组播与版本纠偏。客户端不能用本地 `delta` 决定联网房间的地图，也不能从地鼠状态推断地图。

## 文件结构

- 修改 `../GoServerActorFsm/internal/config/config.go`：声明房间启动人数、首批活跃数、并发上限和补刷间隔。
- 修改 `../GoServerActorFsm/internal/gamelogic/shrew_timeline.go`：把“九洞预建”改为“稀疏活跃周期 + 服务端补刷”。
- 新增 `../GoServerActorFsm/internal/gamelogic/map_timeline.go`：维护房间地图、切图绝对时间和单调版本号。
- 修改 `../GoServerActorFsm/internal/room/attack_actor.go`：拥有房间阶段，满房后统一开局，并对同房间客户端广播同一份时间线。
- 修改 `../GoServerActorFsm/internal/room/room_actor.go`：将新配置传入 `AttackActor`，并保留 3 人一组的分配行为。
- 修改两端 `api/proto/kick.proto`：在 `GameSnapshot` 和 `ShrewTimelinePush` 传递房间阶段、人数和统一开局时间，并新增 `MapTimeline` / `MapStatePush`；服务器运行 `scripts/gen-proto.sh` 后客户端复制 proto。
- 修改 `src/network/ProtocolTypes.ts`、`KickProtoCodec.ts`、`KickSocket.ts`、`NetworkAdapter.ts`：解码房间和地图字段，按 RTT 中点校正服务端时钟。
- 修改 `src/game/features/shrew/ShrewServerSync.ts`：把全量快照应用为九个固定 Shrew 槽位的完整替换。
- 修改 `src/game/board/MapCycleSystem.ts`、`SceneComponent.ts` 和 `SceneEntity.ts`：联网模式以服务端地图时间线推进，离线演示仍保留本地循环；地图位置更新抽成可复用的 board 操作。
- 新增 `src/game/board/ServerMapSync.ts`：把网络地图基线应用为 ECS 状态，并在服务端时钟跨过切图点时驱动同一套 board 操作。
- 修改 `src/tests/**` 与服务端 `internal/**_test.go`：覆盖房间分组、空场、单只开局、快照替换和时钟校正。
- 修改 `docs/protocol.md`：记录房间阶段、地图权威来源、快照完整替换和分组同步约束。

### Task 1: 锁定 3 人分组和新房空场

**Files:**

- Modify: `../GoServerActorFsm/internal/room/room_actor_test.go`
- Modify: `../GoServerActorFsm/internal/room/attack_actor_test.go`
- Modify: `../GoServerActorFsm/internal/config/config.go`
- Modify: `../GoServerActorFsm/internal/room/room_actor.go`
- Modify: `../GoServerActorFsm/internal/room/attack_actor.go`

- [ ] **Step 1: 写失败测试，证明前三人同房、第四人新房且空场**

```go
func TestRoomGroupsThreeSessionsAndKeepsNextGroupEmpty(t *testing.T) {
    room := NewRoomActor(Config{RoomSize: 3, MinPlayersToStart: 3, HoleCount: 9, NowMS: func() int64 { return 10_000 }})
    first := joinRoom(t, room, 1)
    second := joinRoom(t, room, 2)
    third := joinRoom(t, room, 3)
    fourth := joinRoom(t, room, 4)

    if first.AttackID != second.AttackID || second.AttackID != third.AttackID { t.Fatal("first three sessions must share attack") }
    if fourth.AttackID == first.AttackID { t.Fatal("fourth session must enter a new attack") }
    snapshot := requestSnapshot(t, room, 4)
    if len(snapshot.GetActiveCycles()) != 0 { t.Fatal("new filling room must have no shrews") }
}
```

- [ ] **Step 2: 运行失败测试**

Run: `go test ./internal/room -run TestRoomGroupsThreeSessionsAndKeepsNextGroupEmpty -count=1`

Expected: FAIL，因为当前新 `AttackActor` 会立即创建 9 个周期。

- [ ] **Step 3: 添加显式房间启动配置并传给 AttackActor**

```go
type ServerConfig struct {
    // existing fields
    RoomSize            int
    MinPlayersToStart   int
    InitialActiveShrews int
    MaxActiveShrews     int
    InterSpawnMS        int
}
```

在 `Default()` 中设为 `3, 3, 1, 1, 800`；在 `RoomActor.pickAttack()` 构造 `AttackConfig` 时逐项传递。禁止以 `len(players)` 或客户端计时器隐式决定开局。

- [ ] **Step 4: 在 AttackActor 增加阶段并让未满房快照为空**

```go
type AttackPhase int
const (
    AttackPhaseFilling AttackPhase = 1
    AttackPhaseRunning AttackPhase = 2
)

type AttackActor struct {
    // existing fields
    phase     AttackPhase
    startAtMS int64
}
```

`handleJoin()` 在人数达到 `MinPlayersToStart` 时执行 `startAtMS = now + InterSpawnMS`，调用 `timeline.Start(startAtMS, InitialActiveShrews)`，切为 `Running`，并对所有已有玩家广播完整时间线。`snapshot()` 在 `Filling` 返回 `active_cycles=[]`。

- [ ] **Step 5: 运行房间测试**

Run: `go test ./internal/room -count=1`

Expected: PASS，前三人使用同一 `attack_id`，第四人使用新 `attack_id` 且快照没有活跃地鼠。

- [ ] **Step 6: 提交服务端房间生命周期**

```bash
git -C ../GoServerActorFsm add internal/config/config.go internal/room/room_actor.go internal/room/attack_actor.go internal/room/room_actor_test.go internal/room/attack_actor_test.go
git -C ../GoServerActorFsm commit -m "feat: 新房满三人后统一开局"
```

### Task 2: 改为单只地鼠的服务端稀疏时间线

**Files:**

- Modify: `../GoServerActorFsm/internal/gamelogic/shrew_timeline.go`
- Modify: `../GoServerActorFsm/internal/gamelogic/shrew_timeline_test.go`
- Modify: `../GoServerActorFsm/internal/room/attack_actor.go`

- [ ] **Step 1: 写失败测试，证明首轮和后续并发都不超过 1**

```go
func TestSparseTimelineStartsOneShrewAndReplacesItAfterEnd(t *testing.T) {
    timeline := NewShrewTimeline(9, timing, 10_000, rng)
    timeline.Start(10_800, 1)

    first := timeline.ActiveCycles(10_800)
    if len(first) != 1 { t.Fatalf("active=%d, want 1", len(first)) }
    timeline.Advance(first[0].EndMS + 800)
    next := timeline.ActiveCycles(first[0].EndMS + 800)
    if len(next) != 1 { t.Fatalf("active=%d, want 1", len(next)) }
    if next[0].SpawnSeq <= first[0].SpawnSeq { t.Fatal("replacement must have a newer spawn sequence") }
}
```

- [ ] **Step 2: 运行失败测试**

Run: `go test ./internal/gamelogic -run TestSparseTimelineStartsOneShrewAndReplacesItAfterEnd -count=1`

Expected: FAIL，因为当前构造函数直接创建 9 个周期。

- [ ] **Step 3: 用活跃集合和下一次补刷时间替换预建九洞周期**

```go
type ShrewTimeline struct {
    holeCount      int
    maxActive      int
    interSpawnMS   int64
    started        bool
    nextSpawnAtMS  int64
    nextSpawnSeq   uint64
    cycles         map[int]ShrewCycle
    // timing, rng, rev
}
```

`Start(startAtMS, initialActive)` 只设置启动时间；`Advance(nowMS)` 先删除已结束周期，再在 `nowMS >= nextSpawnAtMS` 且 `len(cycles) < maxActive` 时选择一个未活跃洞位创建周期，并把 `nextSpawnAtMS` 推进 `InterSpawnMS`。洞位选择只使用服务端 RNG；客户端不参与随机。

- [ ] **Step 4: 保持命中后补刷顺序**

`ApplyHit()` 保留 `Dizzy` 终止区间；区间结束后由 `Advance()` 在 `InterSpawnMS` 后补刷。`AttackActor` 仍按“时间线推送先于状态推送”发送，避免客户端覆盖 Dizzy。

- [ ] **Step 5: 运行规则和房间回归测试**

Run: `go test ./internal/gamelogic ./internal/room -count=1`

Expected: PASS，活跃周期始终不超过 `MaxActiveShrews=1`，新周期只由服务端产生。

- [ ] **Step 6: 提交稀疏刷怪规则**

```bash
git -C ../GoServerActorFsm add internal/gamelogic/shrew_timeline.go internal/gamelogic/shrew_timeline_test.go internal/room/attack_actor.go
git -C ../GoServerActorFsm commit -m "feat: 服务端限制地鼠并发数量"
```

### Task 3: 服务端维护房间级地图时间线

**Files:**

- Modify: `../GoServerActorFsm/internal/config/config.go`
- Create: `../GoServerActorFsm/internal/gamelogic/map_timeline.go`
- Create: `../GoServerActorFsm/internal/gamelogic/map_timeline_test.go`
- Modify: `../GoServerActorFsm/internal/room/attack_actor.go`
- Modify: `../GoServerActorFsm/internal/room/attack_actor_test.go`

- [ ] **Step 1: 写失败测试，固定地图顺序、绝对切图点和补偿推进**

```go
func TestMapTimelineStartsAtMeadowAndCatchesUpByServerTime(t *testing.T) {
    timeline := NewMapTimeline(16_000)
    timeline.Start(10_800)

    require.Equal(t, MapMeadow, timeline.Snapshot(10_800).CurrentMap)
    require.Equal(t, int64(26_800), timeline.Snapshot(10_800).NextSwitchMS)
    require.False(t, timeline.Advance(26_799).Changed)
    require.Equal(t, MapShip, timeline.Advance(26_800).CurrentMap)
    require.Equal(t, MapSpace, timeline.Advance(42_801).CurrentMap)
}
```

- [ ] **Step 2: 运行失败测试**

Run: `go test ./internal/gamelogic -run TestMapTimelineStartsAtMeadowAndCatchesUpByServerTime -count=1`

Expected: FAIL，因为服务端当前没有地图状态，客户端只能以自身帧时间轮换地图。

- [ ] **Step 3: 增加纯服务端 `MapTimeline`**

```go
type MapTimeline struct {
    currentMap   int32
    revision     uint64
    started      bool
    mapStartedMS int64
    nextSwitchMS int64
    cycleMS      int64
}
```

`Start(startAtMS)` 只在房间进入 `Running` 时生效，初始地图为 `Meadow`，`nextSwitchMS = startAtMS + cycleMS`。`Advance(nowMS)` 必须循环跨越所有已错过的切图点并递增 `revision`，因此慢客户端重连或服务端短暂停顿后都会得到当前正确地图。地图枚举值必须在 Go 与客户端 `MapType` 中一一对应，禁止把客户端资源索引当协议值。

- [ ] **Step 4: 让 AttackActor 同时推进两条房间时间线**

为 `AttackConfig` 增加 `MapCycleMS=16000`，为 `AttackActor` 增加 `mapTimeline`。将现有周期推进收敛为 `advanceGameState(nowMS)`：每次处理客户端 envelope 和快照请求都调用它；地鼠变化继续发 `ShrewTimelinePush`，地图 `revision` 变化时只向本 `AttackActor.players` 发 `MapStatePush`。客户端仍以快照中的绝对切图点自主切换，所以服务端在无请求时无需为每个房间常驻 ticker。`snapshot()` 无论 `Filling` 或 `Running` 都包含地图基线；`Filling` 固定为 Meadow、`next_switch_ms=0`。

- [ ] **Step 5: 覆盖同房地图组播和新房默认草地**

在 `attack_actor_test.go` 断言：同一 attack 的三条 outbound 都收到同一份 `MapStatePush`；另一 attack 没有收到；第四人新建 attack 的快照为 Meadow 且没有下一次切图时间。测试也要断言旧 `map_revision` 不能覆盖新 revision。

- [ ] **Step 6: 运行服务端地图回归并提交**

```bash
cd ../GoServerActorFsm && go test ./internal/gamelogic ./internal/room -count=1
git -C ../GoServerActorFsm add internal/config/config.go internal/gamelogic/map_timeline.go internal/gamelogic/map_timeline_test.go internal/room/attack_actor.go internal/room/attack_actor_test.go
git -C ../GoServerActorFsm commit -m "feat: 服务端统一房间地图时间线"
```

Expected: PASS，地图只由房间 Actor 推进，且组播范围与地鼠时间线完全相同。

### Task 4: 协议表达房间阶段和地图时间线并同步 proto

**Files:**

- Modify: `../GoServerActorFsm/api/proto/kick.proto`
- Modify: `../GoServerActorFsm/internal/protocol/pb/kick.pb.go`（由脚本生成）
- Modify: `api/proto/kick.proto`
- Modify: `src/network/ProtocolTypes.ts`
- Modify: `src/network/KickProtoCodec.ts`
- Modify: `src/network/KickSocket.ts`
- Modify: `src/tests/network/KickProtoCodec.test.ts`

- [ ] **Step 1: 写失败的 protobuf 往返测试**

```ts
expect(decodeInboundMessage(encodeGameSnapshotResponse({
  seqId: 1,
  snapshot: {
    roomPhase: "filling",
    playerCount: 1,
    roomSize: 3,
    startAtMs: 0,
    mapTimeline: { currentMap: 2, mapRevision: 0, mapStartedMs: 0, nextSwitchMs: 0, nextMap: 0, cycleMs: 16000 },
    activeCycles: [],
    // existing snapshot fields
  },
}))).toMatchObject({ value: { snapshot: { roomPhase: "filling", activeCycles: [] } } });
```

- [ ] **Step 2: 运行失败测试**

Run: `npm test -- --run src/tests/network/KickProtoCodec.test.ts`

Expected: FAIL，因为当前快照没有房间阶段和地图时间线字段，也没有地图推送消息。

- [ ] **Step 3: 扩展 proto 和业务类型**

在 `GameSnapshot` 和 `ShrewTimelinePush` 增加固定字段：

```proto
int32 room_phase = 7;      // 1=filling, 2=running
int32 player_count = 8;
int32 room_size = 9;
int64 start_at_ms = 10;
MapTimeline map_timeline = 11;
```

新增独立的地图消息，并固定 `3003` 为服务端组播消息号：

```proto
message MapTimeline {
  int32 current_map = 1;       // 对应客户端 MapType：Meadow=2, Ship=3, Space=4
  uint64 map_revision = 2;
  int64 map_started_ms = 3;
  int64 next_switch_ms = 4;    // 0 表示 Filling，尚未启动
  int32 next_map = 5;
  int64 cycle_ms = 6;
}

message MapStatePush {
  int64 server_time_ms = 1;
  uint64 attack_id = 2;
  uint64 attack_epoch = 3;
  MapTimeline timeline = 4;
}
```

执行：

```bash
cd ../GoServerActorFsm && sh scripts/gen-proto.sh
cp ../GoServerActorFsm/api/proto/kick.proto api/proto/kick.proto
diff -u ../GoServerActorFsm/api/proto/kick.proto api/proto/kick.proto
```

在客户端定义 `RoomPhase.Filling`、`RoomPhase.Running`、`MapTimeline` 与 `MapStatePush`，在 `PROTOCOL_MSG_IDS` 增加 `MapStatePush: 3003`，并在 `InboundMessage`、`KickSocket` 推送分发和手写 protobuf codec 中逐一覆盖。所有字段号必须与 proto 完全一致；64 位毫秒时间与 revision 在 JavaScript 安全整数范围内才可转为 `number`，否则 decoder 必须显式拒绝。

- [ ] **Step 4: 运行协议测试和类型检查**

Run: `npm test -- --run src/tests/network/KickProtoCodec.test.ts src/tests/network/KickSocket.test.ts && npx tsc --noEmit`

Expected: PASS，空场、运行中快照和地图变更组播都能无损往返，未知字段仍被跳过。

- [ ] **Step 5: 提交协议改动**

```bash
git -C ../GoServerActorFsm add api/proto/kick.proto internal/protocol/pb/kick.pb.go
git -C ../GoServerActorFsm commit -m "feat: 协议增加房间地图时间线"
git add api/proto/kick.proto src/network/ProtocolTypes.ts src/network/KickProtoCodec.ts src/network/KickSocket.ts src/tests/network/KickProtoCodec.test.ts
git commit -m "feat: 客户端识别房间地图时间线"
```

### Task 5: 客户端按服务端绝对时间同步地图

**Files:**

- Create: `src/network/ServerClock.ts`
- Modify: `src/game/features/shrew/ServerGameClock.ts`
- Modify: `src/game/board/SceneComponent.ts`
- Modify: `src/game/board/SceneEntity.ts`
- Modify: `src/game/board/MapCycleSystem.ts`
- Create: `src/game/board/ServerMapSync.ts`
- Modify: `src/game/board/BoardOps.ts`
- Modify: `src/game/features/shrew/ShrewBoardSyncSystem.ts`
- Modify: `src/network/NetworkAdapter.ts`
- Modify: `src/app/GameScene.ts`
- Create: `src/tests/game/board/ServerMapSync.test.ts`
- Modify: `src/tests/game/board/MapCycleSystem.test.ts`

- [ ] **Step 1: 写失败测试，服务端地图基线必须立即投影整个棋盘**

```ts
applyServerMapTimeline(world, {
  currentMap: MapType.Meadow,
  mapRevision: 7,
  mapStartedMs: 10_800,
  nextSwitchMs: 26_800,
  nextMap: MapType.Ship,
  cycleMs: 16_000,
});

syncServerMap(world, 26_800);
expect(SceneComponent.currentMap[scene]).toBe(MapType.Ship);
expect(holePositions(world)).toEqual(SHIP_HOLE_POSITIONS);
expect(shrewMapTypes(world)).toEqual([MapType.Ship]);
```

同时写出两个边界：`map_revision=6` 的迟到包不能覆盖 revision 7；`serverControlled=1` 时 `MapCycleSystem` 忽略本地 `delta`，仅按传入的服务端毫秒跨越切图点。

- [ ] **Step 2: 运行失败测试**

Run: `npm test -- --run src/tests/game/board/ServerMapSync.test.ts src/tests/game/board/MapCycleSystem.test.ts`

Expected: FAIL，因为当前地图由 `sceneTimer += delta` 决定，网络快照不能设置地图。

- [ ] **Step 3: 抽取可复用的地图 board 操作**

从 `MapCycleSystem.ts` 抽出 `applyMapToBoard(world, mapType)` 到 `BoardOps.ts`：它只设置 `SceneComponent.currentMap`、`transitioning` 以及九个 `HoleComponent` 的位置和 cover z-order。现有离线循环和新的联网同步都调用该函数，避免两条地图布局逻辑分叉。

`ShrewBoardSyncSystem` 保持为 shrew feature 的 owner：读取公开的 `SceneComponent.currentMap` 后更新活跃 `ShrewComponent.mapType`，从而在服务端切图时更新地鼠节点资源；board 层不得导入 shrew 内部组件。

- [ ] **Step 4: 把服务端时钟提升为网络共享能力**

将 `src/game/features/shrew/ServerGameClock.ts` 的实现迁移为 `src/network/ServerClock.ts`，提供 `setServerClockSample(serverTimeMs, clientMidpointMs)`、`getServerNowMs()` 与 `resetServerClock()`。地鼠同步和地图同步必须引用同一实例；旧文件只保留兼容 re-export，或在同一提交中删除并更新全部 import，不能存在两套 offset。

- [ ] **Step 5: 应用快照和地图组播，再按时钟自主切图**

`SceneComponent` 增加 `serverControlled`、`mapRevision`、`mapStartedMs`、`nextSwitchMs`、`nextMap`、`cycleMs`。`GameScene` 仅接受与当前快照相同 `attack_id/attack_epoch` 的 `MapStatePush`；`applyServerMapTimeline()` 仅接受不小于已应用 revision 的基线，先写 ECS，再调用 `syncServerMap(world, getServerNowMs())` 处理飞行中快照。

`MapCycleSystem` 在 `serverControlled=1` 时每帧调用 `syncServerMap(world, getServerNowMs())`，绝不累加本地 `delta`。`NetworkAdapter` 增加 `onMapState`，`GameScene` 在完整 `GameSnapshot` 与 `MapStatePush` 中都调用 `applyServerMapTimeline()`；推送晚到时因 `nextSwitchMs` 已跨越而立即收敛到正确地图。离线/本地演示模式仍走既有 `sceneTimer` 循环。

- [ ] **Step 6: 运行地图、网络和视图回归**

Run: `npm test -- --run src/tests/game/board/ServerMapSync.test.ts src/tests/game/board/MapCycleSystem.test.ts src/tests/network/NetworkAdapter.test.ts src/tests/view/GameScene.test.ts && npx tsc --noEmit`

Expected: PASS，三个客户端在同一服务端时间切图，迟到快照和迟到推送都不会回退地图。

- [ ] **Step 7: 提交客户端地图同步**

```bash
git add src/network/ServerClock.ts src/game/features/shrew/ServerGameClock.ts src/game/board/SceneComponent.ts src/game/board/SceneEntity.ts src/game/board/MapCycleSystem.ts src/game/board/ServerMapSync.ts src/game/board/BoardOps.ts src/game/features/shrew/ShrewBoardSyncSystem.ts src/network/NetworkAdapter.ts src/app/GameScene.ts src/tests/game/board/ServerMapSync.test.ts src/tests/game/board/MapCycleSystem.test.ts
git commit -m "feat: 客户端按服务端时间同步地图"
```

### Task 6: 客户端将快照作为完整替换并收敛时钟偏差

**Files:**

- Modify: `src/game/features/shrew/ShrewServerSync.ts`
- Modify: `src/network/ServerClock.ts`
- Modify: `src/network/NetworkAdapter.ts`
- Modify: `src/app/GameScene.ts`
- Modify: `src/tests/game/features/shrew/ShrewServerSync.test.ts`
- Modify: `src/tests/network/NetworkAdapter.test.ts`

- [ ] **Step 1: 写失败测试，空场快照必须停止所有本地地鼠**

```ts
applyServerGameSnapshot(world, fillingSnapshot);
for (const eid of shrews) {
  expect(ShrewComponent.serverControlled[eid]).toBe(1);
  expect(ShrewComponent.actionState[eid]).toBe(ShrewAction.Wait);
  expect(ShrewComponent.isClickable[eid]).toBe(0);
}
```

- [ ] **Step 2: 写失败测试，运行中快照只激活单个洞位**

```ts
applyServerGameSnapshot(world, runningSnapshotWithOneCycle);
expect(ShrewComponent.spawnSeq[activeShrew]).toBe(8);
expect(ShrewComponent.serverControlled[inactiveShrew]).toBe(1);
expect(ShrewComponent.actionState[inactiveShrew]).toBe(ShrewAction.Wait);
```

- [ ] **Step 3: 运行失败测试**

Run: `npm test -- --run src/tests/game/features/shrew/ShrewServerSync.test.ts`

Expected: FAIL，因为当前 `applyServerGameSnapshot()` 仅循环 `activeCycles`，缺失洞位会保留本地随机状态。

- [ ] **Step 4: 先清空九个固定槽位，再投影完整快照**

在 `applyServerGameSnapshot()` 中先查询所有 Shrew，执行 `serverControlled=1`、`actionState=Wait`、`isClickable=0`、清零 `spawnSeq`、阶段时间和 override；仅当 `snapshot.roomPhase === Running` 时再为 `activeCycles` 调用 `applyCycle()`。`ShrewTimelinePush` 保持增量更新，不承担清空语义。

- [ ] **Step 5: 按 RTT 中点校正时钟**

```ts
const clientReceiveMs = Date.now();
const midpointMs = (response.clientSendMs + clientReceiveMs) / 2;
setServerClockSample(response.serverTimeMs, midpointMs);
```

`NetworkAdapter.requestTimeSync()` 必须把原始 `clientSendMs` 交给回调；`GameScene` 只接受最新且 RTT 更小的采样，避免较晚回包把共享时钟调回去。Task 5 的地图同步和本任务的地鼠相位必须读取同一个 `getServerNowMs()` 结果。

- [ ] **Step 6: 运行客户端同步测试**

Run: `npm test -- --run src/tests/game/features/shrew/ShrewServerSync.test.ts src/tests/network/NetworkAdapter.test.ts src/tests/view/GameScene.test.ts && npx tsc --noEmit`

Expected: PASS，新房显示空场，同房运行中只显示服务端给出的 1 只地鼠。

- [ ] **Step 7: 提交客户端快照替换**

```bash
git add src/game/features/shrew/ShrewServerSync.ts src/network/NetworkAdapter.ts src/app/GameScene.ts src/tests/game/features/shrew/ShrewServerSync.test.ts src/tests/network/NetworkAdapter.test.ts
git commit -m "feat: 快照完整替换地鼠状态"
```

### Task 7: 三客户端真实联调与文档

**Files:**

- Modify: `docs/protocol.md`
- Modify: `../GoServerActorFsm/internal/ws/session_test.go`
- Modify: `src/tests/network/WebSocketTransport.test.ts`

- [ ] **Step 1: 写服务端广播范围测试**

```go
// Advance attack A through a map boundary and send a kick, then assert only
// attack A's outbound channels receive MapStatePush, ShrewTimelinePush and
// ShrewStatePush; attack B remains empty.
```

测试明确验证“同组同步，不同组隔离”，不以视觉现象代替断言。

- [ ] **Step 2: 更新协议文档**

写明：`RoomSize=3` 是组播边界；`Filling` 快照的 `active_cycles=[]` 是正常空场且地图固定 Meadow；`Running` 快照是完整替换；`GameSnapshot` 用于入场和重连；`ShrewTimelinePush` 用于同组地鼠变化；`MapStatePush` 用于同组地图版本纠偏。记录 `next_switch_ms` 是服务端 Unix 毫秒，联网客户端必须用校正后的服务端时钟切图，不能累加渲染帧 `delta`。

- [ ] **Step 3: 运行完整验证**

```bash
cd ../GoServerActorFsm && go test ./...
cd ../LayaEcsDemo && npm test
cd ../LayaEcsDemo && npx tsc --noEmit
cd ../LayaEcsDemo && npm run debug:ready
```

Expected: Go 测试、237+ 客户端测试、类型检查和 debug 构建全部通过。

- [ ] **Step 4: 真实三窗口验收**

```bash
cd ../GoServerActorFsm && go run ./cmd/server
```

依次打开 3 个 `http://localhost:8080/debug-tsc.html?networkMode=websocket`：三者必须显示相同 `attack_id`、`timeline_rev`、`spawn_seq`、地鼠阶段和 `map_revision`。在每个 16 秒地图边界前后记录浏览器控制台的 `serverNowMs/currentMap/mapRevision`，三窗口必须在相同 `next_switch_ms` 由 Meadow 同时切 Ship，再切 Space。打开第 4 个窗口：它必须获得新的 `attack_id`，保持 Meadow 空场且没有 `next_switch_ms`；再打开第 5、6 个窗口后，这三者在同一个 `start_at_ms` 同时出现 1 只地鼠，并在其后的同一地图边界切图。

- [ ] **Step 5: 提交文档和验收测试**

```bash
git add docs/protocol.md src/tests/network/WebSocketTransport.test.ts
git commit -m "docs: 说明三人房间地图同步规则"
git -C ../GoServerActorFsm add internal/ws/session_test.go
git -C ../GoServerActorFsm commit -m "test: 覆盖房间组播隔离"
```

## 自检

- 需求“3 个客户端同步”：Task 1 固定同一 `AttackActor` 的分组，Task 7 用三窗口验证同一 `attack_id` 与时间线。
- 需求“起步地鼠太多”：Task 2 用 `InitialActiveShrews=1` 和 `MaxActiveShrews=1` 限制服务端周期。
- 需求“新开组默认没地鼠”：Task 1 的 `Filling` 阶段与 Task 6 的快照完整替换共同保证服务端和客户端都为空场。
- 需求“地图由服务端控制且同组同时切换”：Task 3 用 `MapTimeline` 作为 AttackActor 的权威状态，Task 4 传输快照和地图组播，Task 5 用同一个校正服务端时钟按 `next_switch_ms` 切图，Task 7 以三窗口在切图边界验收。
- 分组边界、协议字段、客户端渲染和测试路径均有明确 owner；没有依赖客户端随机数、渲染帧计时器或本地状态机恢复服务端对局。
