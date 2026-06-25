import { describe, expect, it } from "vitest";
import { createGameWorld } from "../../ecs/world";
import { createSingletonEntities } from "../helpers/SingletonTestEntities";
import { createHoleEntities, createShrewEntity } from "../helpers/CoreTestEntities";
import { HammerComponent } from "../../ecs/components";
import { HoleComponent, ShrewComponent } from "../../game/features/shrew";
import { MapType, ShrewAction, ShrewType } from "../../game/features/shrew";
import { DESIGN_RESOLUTION, HOLE_PROTOCOL } from "../../config/GameTuning";
import { KickInputAdapter, KICK_INPUT_SOUNDS } from "../../view/KickInputAdapter";
import { HitMissEffect } from "../../effects/HitEffects";

describe("KickInputAdapter", () => {
  it("点中可点击地鼠时播放命中音效并发送击打请求", () => {
    const world = createGameWorld();
    const singletons = createSingletonEntities(world);
    const [holeEid] = createHoleEntities(world, MapType.Meadow);
    const shrewEid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    const sentRequests: any[] = [];
    const playedSounds: string[] = [];
    const traceEvents: Array<{ event: string; payload: Record<string, unknown> }> = [];

    HoleComponent.shrewEid[holeEid] = shrewEid;
    ShrewComponent.isClickable[shrewEid] = 1;
    HammerComponent.hitTable[singletons.hammer] = 1;

    const adapter = new KickInputAdapter({
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

    const adapter = new KickInputAdapter({
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

  it("锤子冷却中时记录 blocked 而不是 miss", () => {
    const world = createGameWorld();
    const singletons = createSingletonEntities(world);
    createHoleEntities(world, MapType.Meadow);
    const sentRequests: any[] = [];
    const playedSounds: string[] = [];
    const traceEvents: Array<{ event: string; payload: Record<string, unknown> }> = [];

    HammerComponent.hitTable[singletons.hammer] = 0;
    HammerComponent.hitCooldownSec[singletons.hammer] = 0.12;

    const adapter = new KickInputAdapter({
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

    HoleComponent.shrewEid[holeEid] = shrewEid;
    ShrewComponent.isClickable[shrewEid] = 1;

    const adapter = new KickInputAdapter({
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
