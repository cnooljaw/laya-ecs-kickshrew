# 协议同步

本文说明客户端如何同步服务端 proto，并维护 protobuf 网络协议边界。改 `api/proto/kick.proto`、`src/network/**` 或真实 socket 接入时先读这里。

## 权威来源

服务端兄弟项目：

```text
../GoServerActorFsm
```

服务端权威 proto：

```text
../GoServerActorFsm/api/proto/kick.proto
```

服务端权威协议号：

```text
../GoServerActorFsm/internal/protocol/codec.go
```

客户端只保留一份 proto：

```text
api/proto/kick.proto
```

当前客户端必须对齐这些 `MsgID`：

```text
PingReqID=1
PongRespID=2
JoinRoomReqID=1001
JoinRoomRespID=1002
GameSnapshotReqID=1003
GameSnapshotRespID=1004
TimeSyncReqID=1005
TimeSyncRespID=1006
KickReqID=2001
KickRespID=2002
ShrewTimelinePushID=3001
ShrewStatePushID=3002
MapStatePushID=3003
ErrorRespID=9001
```

## 手动同步

```bash
cp ../GoServerActorFsm/api/proto/kick.proto api/proto/kick.proto
diff -u ../GoServerActorFsm/api/proto/kick.proto api/proto/kick.proto
rg -n "PingReqID|PongRespID|JoinRoomReqID|GameSnapshotReqID|TimeSyncReqID|KickReqID|KickRespID|ShrewTimelinePushID|ShrewStatePushID|MapStatePushID|ErrorRespID" ../GoServerActorFsm/internal/protocol/codec.go src/network/ProtocolTypes.ts
```

`diff` 没有输出时，客户端 proto 与服务端权威 proto 一致。`rg` 输出中的协议号必须和 `src/network/ProtocolTypes.ts` 的 `PROTOCOL_MSG_IDS` 一致。

## 客户端边界

同步 proto 后按字段更新：

- `src/network/KickProtoCodec.ts`：protobuf wire 编解码，以及 proto snake_case 到业务 camelCase/旧字段名映射。
- `src/network/ProtocolTypes.ts`：业务侧请求/回包类型，保持 view/ECS 不直接依赖 proto 细节。
- `src/network/KickSocket.ts`：只处理 `Uint8Array` protobuf 二进制收发和 `seqId` pending 匹配。
- `src/network/NetworkAdapter.ts`：MockServer 链路也必须走 protobuf 编解码，不退回 JSON。
- `src/tests/network/KickProtoCodec.test.ts`、`KickSocket.test.ts`、`MockServer.test.ts`：同步协议测试。

`Envelope.seq_id` 是请求-回包匹配的唯一权威 seq。`Envelope.msg_id` 是消息类型权威协议号。`ShrewTimelinePush`、`ShrewStatePush` 和 `MapStatePush` 必须使用 `seq_id=0`，不进入 pending 请求表。

## 地鼠权威时间线

服务端 `RoomActor` 以 `RoomSize=3` 分配 `AttackActor`，这也是组播边界。未满房间处于 `Filling`，快照的 `active_cycles=[]`；第三人加入后进入 `Running`，用同一 `start_at_ms` 启动地鼠和地图时间线。不同 `AttackActor` 的客户端不应同步。

服务端 `AttackActor` 拥有房间内的稀疏 `ShrewTimeline`。客户端不再随机生成真实对局中的地鼠生命周期：

```text
GameSnapshot / ShrewTimelinePush
  -> ServerGameClock 校正服务端时间
  -> Shrew ECS 的 spawnSeq 与绝对阶段时间
  -> ShrewStateSystem 按服务端时间投影 Wait/Up/Stand/Down
```

- `GameSnapshot` 是完整替换：客户端先停止所有固定 Shrew 槽位，再仅应用 `active_cycles`。因此 Filling 房间和新房不会残留本地地鼠。
- `GameSnapshotRequest` 在进入场景后发送，客户端每 500ms 刷新一次快照；服务端会推进到当前周期并在生成新周期时广播 `ShrewTimelinePush`。
- `TimeSyncRequest` 每 5 秒按 RTT 中点校正一次共享服务端时钟。时间字段使用毫秒整数，客户端不得用 `f32` 保存。
- `KickRequest.attack_epoch` 和每个 `KickShrew.spawn_seq` 必须来自最新快照。服务端拒绝过期周期、非 `Stand` 阶段或已经命中的请求。
- 命中后服务端先广播更新后的时间线，再广播 `Dizzy` 状态推送；客户端不得在服务端权威模式下本地扣血或切换地鼠状态。

## 地图权威时间线

`GameSnapshot.map_timeline` 是入场、重连和丢包后的完整地图基线，`MapStatePush` 是地图边界变化后的同房组播纠偏。地图值固定为 `Meadow=2`、`Ship=3`、`Space=4`，顺序为 `Meadow -> Ship -> Space -> Meadow`。

```text
GameSnapshot / MapStatePush
  -> ServerClock 校正后的服务端毫秒
  -> SceneComponent 的 map_revision / next_switch_ms
  -> MapCycleSystem 按绝对边界更新 Hole 位置
  -> SceneProjection / HoleProjection 渲染
```

- Filling 快照固定 Meadow，`next_switch_ms=0`，新房不会自行轮图。
- Running 房间以 `start_at_ms` 启动，首个切图点为 `start_at_ms + cycle_ms`；客户端每帧只比较校正后的服务端时间和 `next_switch_ms`，不累加渲染帧 `delta`。
- `map_revision` 单调递增。客户端拒绝旧 revision；迟到但不旧的基线会立即按当前服务端时间追赶到正确地图。
- `MapStatePush.attack_id/attack_epoch` 必须与当前完整快照一致，旧房间推送不得覆盖新房状态。

## 防回退检查

协议更新后检查旧 JSON 协议是否残留：

```bash
rg -n "JSON.stringify\\(fullReq|JSON.parse\\(data|send\\(data: string\\)|onMessage\\(data: string|failed to parse message" src src/tests
```

## 验证

协议最小验证：

```bash
npm test -- --run src/tests/network/KickProtoCodec.test.ts src/tests/network/KickSocket.test.ts src/tests/network/MockServer.test.ts
npx tsc --noEmit
```

协议改动影响运行时网络链路，最终还要跑：

```bash
npm test
npm run debug:ready
```
