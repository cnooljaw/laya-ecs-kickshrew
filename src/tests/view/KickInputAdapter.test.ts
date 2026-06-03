import { describe, expect, it } from "vitest";
import { createGameWorld, createHoleEntities, createShrewEntity, createSingletonEntities } from "../../ecs/world";
import { HammerComponent, HoleComponent, ShrewComponent } from "../../ecs/components";
import { MapType, ShrewAction, ShrewType } from "../../ecs/types";
import { DESIGN_RESOLUTION, HOLE_PROTOCOL } from "../../config/GameTuning";
import { KickInputAdapter, KICK_INPUT_SOUNDS } from "../../view/KickInputAdapter";

function createHammerSpy() {
  return {
    positions: [] as Array<[number, number]>,
    hitCount: 0,
    followTouch(x: number, y: number): void {
      this.positions.push([x, y]);
    },
    playHitAnimation(): void {
      this.hitCount++;
    },
  };
}

describe("KickInputAdapter", () => {
  it("点中可点击地鼠时播放命中音效并发送击打请求", () => {
    const world = createGameWorld();
    const singletons = createSingletonEntities(world);
    const [holeEid] = createHoleEntities(world, MapType.Meadow);
    const shrewEid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    const sentRequests: any[] = [];
    const playedSounds: string[] = [];
    const traceEvents: Array<{ event: string; payload: Record<string, unknown> }> = [];
    const hammer = createHammerSpy();

    HoleComponent.shrewEid[holeEid] = shrewEid;
    ShrewComponent.isClickable[shrewEid] = 1;
    HammerComponent.hitTable[singletons.hammer] = 1;

    const adapter = new KickInputAdapter({
      world,
      singletons,
      network: { sendKick: (req: any) => { sentRequests.push(req); return Promise.resolve({}); } } as any,
      getHammerNode: () => hammer,
      playSound: url => playedSounds.push(url),
      traceLogger: {
        log: (event: string, payload: Record<string, unknown>) => traceEvents.push({ event, payload }),
      },
    });

    const x = HoleComponent.posXRatio[holeEid] * DESIGN_RESOLUTION.width;
    const y = HoleComponent.posYRatio[holeEid] * DESIGN_RESOLUTION.height;
    adapter.handleTouch(x, y);

    expect(hammer.positions).toEqual([[x, y]]);
    expect(hammer.hitCount).toBe(1);
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

    const adapter = new KickInputAdapter({
      world,
      singletons,
      network: { sendKick: (req: any) => { sentRequests.push(req); return Promise.resolve({}); } } as any,
      getHammerNode: () => null,
      playSound: url => playedSounds.push(url),
    });

    adapter.handleTouch(0, 0);

    expect(playedSounds).toEqual([KICK_INPUT_SOUNDS.hitNull]);
    expect(sentRequests).toHaveLength(0);
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
      singletons,
      network: { sendKick: (req: any) => { sentRequests.push(req); return Promise.resolve({}); } } as any,
      getHammerNode: () => null,
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
  });
});
