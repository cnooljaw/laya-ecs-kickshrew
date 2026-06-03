# 协议同步和更新

本文说明客户端如何同步服务端 proto，并维护 protobuf 网络协议边界。改 `api/proto/kick.proto`、`src/network/**` 或真实 socket 接入时优先读这里。

## 权威来源

服务端兄弟项目：

```text
../GoServerActorFsm
```

服务端权威 proto：

```text
../GoServerActorFsm/api/proto/kick.proto
```

客户端只保留一份对应 proto：

```text
api/proto/kick.proto
```

## 手动同步

```bash
cp ../GoServerActorFsm/api/proto/kick.proto api/proto/kick.proto
diff -u ../GoServerActorFsm/api/proto/kick.proto api/proto/kick.proto
```

`diff` 没有输出时，说明客户端 proto 和服务端权威 proto 一致。

## 客户端协议边界

同步 proto 后按字段更新：

- `src/network/KickProtoCodec.ts`：protobuf wire 编解码和 proto snake_case ↔ 业务 camelCase/旧字段名映射。
- `Envelope.seq_id` 是请求-回包匹配的唯一权威 seq；业务 payload（如 `KickRequest`/`KickResponse`）不再携带 `seq_id`。
- `src/network/ProtocolTypes.ts`：业务侧请求/回包类型，保持 view/ECS 不直接依赖 proto 细节。
- `src/network/KickSocket.ts`：只处理 `Uint8Array` protobuf 二进制收发和 `seqId` pending 匹配。
- `src/network/NetworkAdapter.ts`：MockServer 链路也必须走 protobuf 编解码，不要退回 JSON。
- `src/tests/network/KickProtoCodec.test.ts`、`src/tests/network/KickSocket.test.ts`、`src/tests/network/MockServer.test.ts`：同步协议测试。

## 防回退检查

协议更新后检查旧 JSON 协议是否残留：

```bash
rg -n "JSON.stringify\\(fullReq|JSON.parse\\(data|send\\(data: string\\)|onMessage\\(data: string|failed to parse message" src src/tests
```

## 验证命令

协议相关最小验证：

```bash
npm test -- --run src/tests/network/KickProtoCodec.test.ts src/tests/network/KickSocket.test.ts src/tests/network/MockServer.test.ts
npx tsc --noEmit
```

协议改动影响运行时网络链路，最终还要跑：

```bash
npm test
npm run debug:ready
```
