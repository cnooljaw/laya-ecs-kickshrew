---
name: room-authoritative-sync
description: Use when implementing, reviewing, or debugging GoServerActorFsm room grouping, server-authoritative Shrew or Map timelines, protobuf snapshots and pushes, ServerClock reconciliation, reconnect recovery, or multi-client synchronization in LayaEcsDemo.
---

# Room Authoritative Sync

Read `AGENTS.md`, `docs/protocol.md`, and `docs/test-guide.md` before editing. Inspect the sibling Go server worktree first and preserve any unrelated changes there.

## Preserve These Invariants

- `RoomActor` assigns a fixed-size group to one `AttackActor`. `attack_id` is the multicast boundary: different attacks must never share state.
- `Filling` has an empty shrew collection, Meadow map, and `next_switch_ms = 0`. Start every authoritative timeline only after the configured player count is reached.
- `AttackActor` owns random selection, shrew lifecycle timing, map order, revisions, and broadcasts. A client must not rebuild those from local randomness or render-frame `delta`.
- Use absolute server milliseconds. A shared `ServerClock` converts server time to client monotonic time and is corrected using the time-sync RTT midpoint.
- `GameSnapshot` is a full recovery baseline and replaces client collections. Incremental pushes correct an already-known baseline; they are not the sole source of truth.
- Discard packets with a different attack id or epoch, and ignore lower shrew or map revisions.

## Implement In This Order

1. Put room phase, membership, and attack ownership in `../GoServerActorFsm/internal/room/`; keep elapsed-time rules in pure `internal/gamelogic` code.
2. Extend the authoritative `.proto` and message IDs on the server, regenerate Go bindings, then copy that proto to the client before changing client codec and TypeScript types together.
3. Keep network callbacks in `src/network/**` and `src/app/GameScene.ts`. Apply state through typed session or feature APIs; do not manipulate Laya nodes in a network callback.
4. Keep persistent map timeline fields in `SceneComponent`. Let `ServerMapSync` establish baselines, and have `MapCycleSystem` compare `ServerClock` with `next_switch_ms` every frame.
5. Apply both local and remote map changes through the board map operations. Apply shrew timeline changes through the shrew feature so view projection remains ECS-driven.

## Validate

Run focused Go room/timeline tests and client codec, `ServerMapSync`, `MapCycleSystem`, and `ShrewServerSync` tests, then run:

```sh
cd ../GoServerActorFsm && go test ./...
cd ../LayaEcsDemo && npm test
cd ../LayaEcsDemo && npx tsc --noEmit
cd ../LayaEcsDemo && npm run debug:ready
```

Exercise three clients in one full room and a fourth client in a new filling room. The first three must share attack id, phase, shrew timeline, map, map revision, and map transition time. The fourth must start empty on Meadow.

## Debugging

- Compare `attack_id`, epoch, revisions, and `next_switch_ms` before investigating rendering. A delayed `MapStatePush` must converge through the absolute deadline, not create a shorter local countdown.
- Console errors originating from extension-owned `content.js` or `polyfill.js` (for example `useCache` or a missing message receiver) are not application failures by themselves. Reproduce in a clean or incognito profile and follow the source location; `src/app/Main.ts` startup logging is not a socket or runtime exception.
