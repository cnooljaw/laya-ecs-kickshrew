# 3 人房间同步与稀疏地鼠开局 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让同一 3 人房间的客户端渲染同一条服务端时间线，未满的新房保持空场，满房后以单只地鼠开始并始终限制活跃数量。

**Architecture:** `RoomActor` 继续按 3 人分配 `AttackActor`，但 `AttackActor` 增加 `Filling` 和 `Running` 两个房间阶段。`ShrewTimeline` 不再为九个洞位预建周期，而是只保存服务端选中的活跃周期；快照是完整替换状态，客户端收到后会先清空九个固定 Shrew 槽位，再投影服务端给出的少量周期。

**Tech Stack:** Go 1.23、Gorilla WebSocket、protobuf、TypeScript、bitecs、Vitest。

---

## 现状与规则

- 现有 `RoomActor.pickAttack()` 将连续连接按 `RoomSize=3` 分配：第 1 至第 3 个客户端进入同一个 `AttackActor`，第 4 个客户端开始新的 `AttackActor`。`broadcast()` 仅发送给当前 `AttackActor.players`，因此它是**按 3 人房间组播**，不同组本来就不应同步。
- 现有 `NewShrewTimeline()` 在房间创建时为 9 个洞全部创建首轮周期，所以一个新组尚未开始也有 9 只待出现的地鼠。
- 本计划固定以下首版规则：`RoomSize=3`、`MinPlayersToStart=3`、`InitialActiveShrews=1`、`MaxActiveShrews=1`、`InterSpawnMS=800`。未满 3 人不生成地鼠；第 3 人加入后，服务器在统一的 `start_at_ms` 后生成 1 只；每轮结束或被击中后最多补 1 只。
- `GameSnapshot.active_cycles` 语义改为“本房间所有活跃地鼠的完整集合”，不是增量。客户端不能让未出现在该集合中的槽位继续本地随机循环。

## 文件结构

- 修改 `../GoServerActorFsm/internal/config/config.go`：声明房间启动人数、首批活跃数、并发上限和补刷间隔。
- 修改 `../GoServerActorFsm/internal/gamelogic/shrew_timeline.go`：把“九洞预建”改为“稀疏活跃周期 + 服务端补刷”。
- 修改 `../GoServerActorFsm/internal/room/attack_actor.go`：拥有房间阶段，满房后统一开局，并对同房间客户端广播同一份时间线。
- 修改 `../GoServerActorFsm/internal/room/room_actor.go`：将新配置传入 `AttackActor`，并保留 3 人一组的分配行为。
- 修改两端 `api/proto/kick.proto`：在 `GameSnapshot` 和 `ShrewTimelinePush` 传递房间阶段、人数和统一开局时间；服务器运行 `scripts/gen-proto.sh` 后客户端复制 proto。
- 修改 `src/network/ProtocolTypes.ts`、`KickProtoCodec.ts`、`NetworkAdapter.ts`：解码房间阶段字段，按 RTT 中点校正服务端时钟。
- 修改 `src/game/features/shrew/ShrewServerSync.ts`：把全量快照应用为九个固定 Shrew 槽位的完整替换。
- 修改 `src/tests/**` 与服务端 `internal/**_test.go`：覆盖房间分组、空场、单只开局、快照替换和时钟校正。
- 修改 `docs/protocol.md`：记录房间阶段、快照完整替换和分组同步约束。

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

### Task 3: 协议表达房间阶段并同步 proto

**Files:**

- Modify: `../GoServerActorFsm/api/proto/kick.proto`
- Modify: `../GoServerActorFsm/internal/protocol/pb/kick.pb.go`（由脚本生成）
- Modify: `api/proto/kick.proto`
- Modify: `src/network/ProtocolTypes.ts`
- Modify: `src/network/KickProtoCodec.ts`
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
    activeCycles: [],
    // existing snapshot fields
  },
}))).toMatchObject({ value: { snapshot: { roomPhase: "filling", activeCycles: [] } } });
```

- [ ] **Step 2: 运行失败测试**

Run: `npm test -- --run src/tests/network/KickProtoCodec.test.ts`

Expected: FAIL，因为当前快照没有房间阶段字段。

- [ ] **Step 3: 扩展 proto 和业务类型**

在 `GameSnapshot` 和 `ShrewTimelinePush` 增加固定字段：

```proto
int32 room_phase = 7;      // 1=filling, 2=running
int32 player_count = 8;
int32 room_size = 9;
int64 start_at_ms = 10;
```

执行：

```bash
cd ../GoServerActorFsm && sh scripts/gen-proto.sh
cp ../GoServerActorFsm/api/proto/kick.proto api/proto/kick.proto
diff -u ../GoServerActorFsm/api/proto/kick.proto api/proto/kick.proto
```

在客户端定义 `RoomPhase.Filling`、`RoomPhase.Running`，并保持手写 protobuf codec 的字段号与 proto 完全一致。

- [ ] **Step 4: 运行协议测试和类型检查**

Run: `npm test -- --run src/tests/network/KickProtoCodec.test.ts src/tests/network/KickSocket.test.ts && npx tsc --noEmit`

Expected: PASS，空场快照与运行中快照都能无损往返。

- [ ] **Step 5: 提交协议改动**

```bash
git -C ../GoServerActorFsm add api/proto/kick.proto internal/protocol/pb/kick.pb.go
git -C ../GoServerActorFsm commit -m "feat: 协议增加房间阶段快照"
git add api/proto/kick.proto src/network/ProtocolTypes.ts src/network/KickProtoCodec.ts src/tests/network/KickProtoCodec.test.ts
git commit -m "feat: 客户端识别房间阶段快照"
```

### Task 4: 客户端将快照作为完整替换并收敛时钟偏差

**Files:**

- Modify: `src/game/features/shrew/ShrewServerSync.ts`
- Modify: `src/game/features/shrew/ServerGameClock.ts`
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

`NetworkAdapter.requestTimeSync()` 必须把原始 `clientSendMs` 交给回调；`GameScene` 只接受最新且 RTT 更小的采样，避免较晚回包把时钟调回去。

- [ ] **Step 6: 运行客户端同步测试**

Run: `npm test -- --run src/tests/game/features/shrew/ShrewServerSync.test.ts src/tests/network/NetworkAdapter.test.ts src/tests/view/GameScene.test.ts && npx tsc --noEmit`

Expected: PASS，新房显示空场，同房运行中只显示服务端给出的 1 只地鼠。

- [ ] **Step 7: 提交客户端快照替换**

```bash
git add src/game/features/shrew/ShrewServerSync.ts src/game/features/shrew/ServerGameClock.ts src/network/NetworkAdapter.ts src/app/GameScene.ts src/tests/game/features/shrew/ShrewServerSync.test.ts src/tests/network/NetworkAdapter.test.ts
git commit -m "feat: 快照完整替换地鼠状态"
```

### Task 5: 三客户端真实联调与文档

**Files:**

- Modify: `docs/protocol.md`
- Modify: `../GoServerActorFsm/internal/ws/session_test.go`
- Modify: `src/tests/network/WebSocketTransport.test.ts`

- [ ] **Step 1: 写服务端广播范围测试**

```go
// Send a kick in attack A, then assert only attack A's outbound channels
// receive ShrewTimelinePush and ShrewStatePush; attack B remains empty.
```

测试明确验证“同组同步，不同组隔离”，不以视觉现象代替断言。

- [ ] **Step 2: 更新协议文档**

写明：`RoomSize=3` 是组播边界；`Filling` 快照的 `active_cycles=[]` 是正常空场；`Running` 快照是完整替换；`GameSnapshot` 用于入场和重连，`ShrewTimelinePush` 用于同组运行中变化。

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

依次打开 3 个 `http://localhost:8080/debug-tsc.html?networkMode=websocket`：三者必须显示相同 `attack_id`、`timeline_rev`、`spawn_seq` 和地鼠阶段。打开第 4 个窗口：它必须获得新的 `attack_id`，且保持空场；再打开第 5、6 个窗口后，这三者同时在同一个 `start_at_ms` 后出现 1 只地鼠。

- [ ] **Step 5: 提交文档和验收测试**

```bash
git add docs/protocol.md src/tests/network/WebSocketTransport.test.ts
git commit -m "docs: 说明三人房间同步规则"
git -C ../GoServerActorFsm add internal/ws/session_test.go
git -C ../GoServerActorFsm commit -m "test: 覆盖房间组播隔离"
```

## 自检

- 需求“3 个客户端同步”：Task 1 固定同一 `AttackActor` 的分组，Task 5 用三窗口验证同一 `attack_id` 与时间线。
- 需求“起步地鼠太多”：Task 2 用 `InitialActiveShrews=1` 和 `MaxActiveShrews=1` 限制服务端周期。
- 需求“新开组默认没地鼠”：Task 1 的 `Filling` 阶段与 Task 4 的快照完整替换共同保证服务端和客户端都为空场。
- 分组边界、协议字段、客户端渲染和测试路径均有明确 owner；没有依赖客户端随机数或本地状态机恢复服务端对局。
