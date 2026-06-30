import { describe, expect, it } from "vitest";
import { createGameWorld } from "../../../framework/ecs/GameWorld";
import { createSingletonEntities } from "../../helpers/SingletonTestEntities";
import { createHoleEntities, createShrewEntity } from "../../helpers/CoreTestEntities";
import { createEntityRuntime } from "../../../framework/ecs/EntityRuntime";
import { HammerComponent } from "../../../game/features/hammer";
import { BoardOccupantKind, BoardPositionComponent, HoleComponent, MapType } from "../../../game/features/board";
import { ShrewAction, ShrewComponent, ShrewType } from "../../../game/features/shrew";
import { MonsterComponent, MonsterEntity, MonsterType } from "../../../game/features/monster";
import { PlayerComponent } from "../../../game/features/playerHud";
import { DESIGN_RESOLUTION, HOLE_PROTOCOL } from "../../../config/GameTuning";
import { KickInputController, KICK_INPUT_SOUNDS } from "../../../game/session";
import { HitMissEffect } from "../../../game/features/playerHud";

describe("KickInputController", () => {
  it("点中可点击地鼠时播放命中音效并发送击打请求", () => {
    const world = createGameWorld();
    const singletons = createSingletonEntities(world);
    const [holeEid] = createHoleEntities(world, MapType.Meadow);
    const shrewEid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    const sentRequests: any[] = [];
    const playedSounds: string[] = [];
    const traceEvents: Array<{ event: string; payload: Record<string, unknown> }> = [];

    bindShrewToHole(holeEid, shrewEid);
    ShrewComponent.isClickable[shrewEid] = 1;
    HammerComponent.hitTable[singletons.hammer] = 1;

    const adapter = new KickInputController({
      world,
      hammerEid: singletons.hammer,
      network: { sendKick: (req: any) => { sentRequests.push(req); return Promise.resolve({}); } } as any,
      effects: { emit: () => {} },
      playSound: url => playedSounds.push(url),
      traceLogger: {
        log: (event: string, payload: Record<string, unknown>) => traceEvents.push({ event, payload }),
      },
    });

    const x = HoleComponent.posXRatio[holeEid] * DESIGN_RESOLUTION.width;
    const y = HoleComponent.posYRatio[holeEid] * DESIGN_RESOLUTION.height;
    adapter.handleTouch(x, y);

    expect(HammerComponent.touchX[singletons.hammer]).toBeCloseTo(x, 3);
    expect(HammerComponent.touchY[singletons.hammer]).toBeCloseTo(y, 3);
    expect(HammerComponent.hitSeq[singletons.hammer]).toBe(1);
    expect(playedSounds).toEqual([KICK_INPUT_SOUNDS.hitOne, KICK_INPUT_SOUNDS.mouse1]);
    expect(sentRequests).toHaveLength(1);
    expect(sentRequests[0].bKickShrew).toBe(1);
    expect(sentRequests[0].shrews[0].shrewindex).toBe(
      Math.round(HoleComponent.gridRow[holeEid]) * 3
        + Math.round(HoleComponent.gridCol[holeEid])
        + HOLE_PROTOCOL.clientIndexOffset,
    );
    expect(traceEvents.map(entry => entry.event)).toEqual([
      "input.touch",
      "hit.detected",
      "network.requestQueued",
    ]);
    expect(traceEvents[1].payload).toMatchObject({
      hitHoleIndex: 0,
      hitShrewEid: shrewEid,
      actionState: ShrewAction.Dizzy,
      dizzyTriggered: true,
    });
  });

  it("点空时只播放未命中音效", () => {
    const world = createGameWorld();
    const singletons = createSingletonEntities(world);
    createHoleEntities(world, MapType.Meadow);
    const sentRequests: any[] = [];
    const playedSounds: string[] = [];
    const effects: unknown[] = [];

    const adapter = new KickInputController({
      world,
      hammerEid: singletons.hammer,
      network: { sendKick: (req: any) => { sentRequests.push(req); return Promise.resolve({}); } } as any,
      effects: {
        emit: (definition, payload) => effects.push([definition, payload]),
      },
      playSound: url => playedSounds.push(url),
    });

    adapter.handleTouch(0, 0);

    expect(playedSounds).toEqual([KICK_INPUT_SOUNDS.hitNull]);
    expect(sentRequests).toHaveLength(0);
    expect(HammerComponent.hitSeq[singletons.hammer]).toBe(1);
    expect(effects).toEqual([[HitMissEffect, undefined]]);
  });

  it("点中 Monster 时本地处理奖励且不发送地鼠 kick 请求", () => {
    const world = createGameWorld();
    const singletons = createSingletonEntities(world);
    const holes = createHoleEntities(world, MapType.Meadow);
    const monster = createEntityRuntime(world, [MonsterEntity]).create(MonsterEntity, {
      monsterType: MonsterType.Rhino,
      posX: 0,
      posY: 0,
      scale: 1,
      durationSec: 10,
    });
    const sentRequests: any[] = [];
    const playedSounds: string[] = [];
    const traceEvents: Array<{ event: string; payload: Record<string, unknown> }> = [];

    MonsterComponent.visible[monster] = 1;
    MonsterComponent.hp[monster] = 1;
    MonsterComponent.reward[monster] = 30;
    MonsterComponent.holeA[monster] = 0;
    MonsterComponent.holeB[monster] = 1;
    MonsterComponent.holeC[monster] = 3;
    BoardPositionComponent.xRatio[monster] = (
      HoleComponent.posXRatio[holes[0]]
      + HoleComponent.posXRatio[holes[1]]
      + HoleComponent.posXRatio[holes[3]]
    ) / 3;
    BoardPositionComponent.yRatio[monster] = (
      HoleComponent.posYRatio[holes[0]]
      + HoleComponent.posYRatio[holes[1]]
      + HoleComponent.posYRatio[holes[3]]
    ) / 3;
    for (const index of [0, 1, 3]) {
      HoleComponent.occupantKind[holes[index]] = BoardOccupantKind.Monster;
      HoleComponent.occupantEid[holes[index]] = monster;
    }
    HammerComponent.hitTable[singletons.hammer] = 1;
    PlayerComponent.money[singletons.player] = 100;

    const adapter = new KickInputController({
      world,
      hammerEid: singletons.hammer,
      network: { sendKick: (req: any) => { sentRequests.push(req); return Promise.resolve({}); } } as any,
      effects: { emit: () => {} },
      playSound: url => playedSounds.push(url),
      traceLogger: {
        log: (event: string, payload: Record<string, unknown>) => traceEvents.push({ event, payload }),
      },
    });

    adapter.handleTouch(
      BoardPositionComponent.xRatio[monster] * DESIGN_RESOLUTION.width,
      BoardPositionComponent.yRatio[monster] * DESIGN_RESOLUTION.height,
    );

    expect(sentRequests).toHaveLength(0);
    expect(playedSounds).toEqual([KICK_INPUT_SOUNDS.hitOne]);
    expect(PlayerComponent.money[singletons.player]).toBe(130);
    expect(traceEvents.map(entry => entry.event)).toEqual([
      "input.touch",
      "monster.hit",
    ]);
  });

  it("锤子冷却中时记录 blocked 而不是 miss", () => {
    const world = createGameWorld();
    const singletons = createSingletonEntities(world);
    createHoleEntities(world, MapType.Meadow);
    const sentRequests: any[] = [];
    const playedSounds: string[] = [];
    const traceEvents: Array<{ event: string; payload: Record<string, unknown> }> = [];

    HammerComponent.hitTable[singletons.hammer] = 0;
    HammerComponent.hitCooldownSec[singletons.hammer] = 0.12;

    const adapter = new KickInputController({
      world,
      hammerEid: singletons.hammer,
      network: { sendKick: (req: any) => { sentRequests.push(req); return Promise.resolve({}); } } as any,
      effects: { emit: () => {} },
      playSound: url => playedSounds.push(url),
      traceLogger: {
        log: (event: string, payload: Record<string, unknown>) => traceEvents.push({ event, payload }),
      },
    });

    adapter.handleTouch(100, 100);

    expect(traceEvents.map(entry => entry.event)).toEqual(["input.touch", "hit.blocked"]);
    expect(traceEvents[1].payload.hitCooldownSec).toBeCloseTo(0.12, 3);
    expect(playedSounds).toEqual([KICK_INPUT_SOUNDS.hitNull]);
    expect(sentRequests).toHaveLength(0);
    expect(HammerComponent.hitSeq[singletons.hammer]).toBe(0);
  });

  it("网络请求失败时记录 requestFailed", async () => {
    const world = createGameWorld();
    const singletons = createSingletonEntities(world);
    const [holeEid] = createHoleEntities(world, MapType.Meadow);
    const shrewEid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    const traceEvents: Array<{ event: string; payload: Record<string, unknown> }> = [];

    bindShrewToHole(holeEid, shrewEid);
    ShrewComponent.isClickable[shrewEid] = 1;

    const adapter = new KickInputController({
      world,
      hammerEid: singletons.hammer,
      network: {
        sendKick: () => Promise.reject(new Error("offline")),
      } as any,
      effects: { emit: () => {} },
      playSound: () => {},
      traceLogger: {
        log: (event: string, payload: Record<string, unknown>) => traceEvents.push({ event, payload }),
      },
    });

    adapter.handleTouch(
      HoleComponent.posXRatio[holeEid] * DESIGN_RESOLUTION.width,
      HoleComponent.posYRatio[holeEid] * DESIGN_RESOLUTION.height,
    );
    await Promise.resolve();

    expect(traceEvents[traceEvents.length - 1]).toEqual({
      event: "network.requestFailed",
      payload: {
        hitHoleIndex: 0,
        hitShrewEid: shrewEid,
        error: "Error: offline",
      },
    });
  });
});

function bindShrewToHole(holeEid: number, shrewEid: number): void {
  ShrewComponent.holeIndex[shrewEid] = HoleComponent.index[holeEid];
  HoleComponent.residentKind[holeEid] = BoardOccupantKind.Shrew;
  HoleComponent.residentEid[holeEid] = shrewEid;
  HoleComponent.occupantKind[holeEid] = BoardOccupantKind.Shrew;
  HoleComponent.occupantEid[holeEid] = shrewEid;
  BoardPositionComponent.xRatio[shrewEid] = HoleComponent.posXRatio[holeEid];
  BoardPositionComponent.yRatio[shrewEid] = HoleComponent.posYRatio[holeEid];
  BoardPositionComponent.zIndex[shrewEid] = HoleComponent.zIndex[holeEid];
}
