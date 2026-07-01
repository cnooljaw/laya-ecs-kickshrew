import { describe, expect, it } from "vitest";
import {
  AnimationComponent,
  ShrewComponent,
} from "../../game/features/shrew";
import {
  BoardPositionComponent,
  HoleComponent,
  SceneComponent,
} from "../../game/features/board";
import {
  HoleEntity,
  SceneEntity,
} from "../../game/features/board";
import {
  ShrewEntity,
} from "../../game/features/shrew";
import { createEntityRuntime } from "../../framework/ecs/EntityRuntime";
import { MapType } from "../../game/features/board";
import { AnimType, ShrewAction, ShrewType } from "../../game/features/shrew";
import { createGameWorld } from "../../framework/ecs/GameWorld";
import type { IHoleNode, ISceneLayer } from "../../game/features/board";
import type { IShrewNode } from "../../game/features/shrew";
import { createProjectionRuntime } from "../../framework/sync/ProjectionRuntime";
import {
  HoleProjection,
  SceneProjection,
} from "../../game/features/board";
import {
  ShrewProjection,
} from "../../game/features/shrew";

function createShrewNode(calls: {
  sprites: Array<[number, number]>;
  animations: Array<[number, number, number]>;
  clickables: boolean[];
  hats: boolean[];
  blocked: boolean[];
  positions: Array<[number, number]>;
  props: number[];
  zOrders: number[];
}): IShrewNode {
  return {
    setSpriteFrame: (type, map) => calls.sprites.push([type, map]),
    setAnimation: (action, animation, progress) => {
      calls.animations.push([action, animation, progress]);
    },
    setClickable: clickable => calls.clickables.push(clickable),
    setHatVisible: visible => calls.hats.push(visible),
    setBlockedByOccupant: blocked => calls.blocked.push(blocked),
    setPosition: (x, y) => calls.positions.push([x, y]),
    setPropType: propType => calls.props.push(propType),
    setZOrder: z => calls.zOrders.push(z),
  };
}

describe("compiled core projections", () => {
  it("deduplicates shrew sprite and animation projection rows", () => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, [ShrewEntity]);
    const eid = entities.create(ShrewEntity, {
      shrewType: ShrewType.Red,
      mapType: MapType.Meadow,
    });
    const calls = {
      sprites: [] as Array<[number, number]>,
      animations: [] as Array<[number, number, number]>,
      clickables: [] as boolean[],
      hats: [] as boolean[],
      blocked: [] as boolean[],
      positions: [] as Array<[number, number]>,
      props: [] as number[],
      zOrders: [] as number[],
    };
    const runtime = createProjectionRuntime([ShrewProjection]);
    runtime.mount(ShrewProjection, eid, createShrewNode(calls));
    runtime.mark(world);
    runtime.sync(world);
    calls.sprites.length = 0;
    calls.animations.length = 0;

    ShrewComponent.shrewType[eid] = ShrewType.Blue;
    ShrewComponent.mapType[eid] = MapType.Ship;
    ShrewComponent.actionState[eid] = ShrewAction.Up;
    AnimationComponent.animType[eid] = AnimType.Up;
    AnimationComponent.progress[eid] = 0.5;
    AnimationComponent.duration[eid] = 0.31;
    runtime.mark(world);
    runtime.sync(world);

    expect(calls.sprites).toEqual([[ShrewType.Blue, MapType.Ship]]);
    expect(calls.animations).toEqual([[ShrewAction.Up, AnimType.Up, 0.5]]);
  });

  it("keeps gameplay-only shrew fields out of the view contract", () => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, [ShrewEntity]);
    const eid = entities.create(ShrewEntity, {
      shrewType: ShrewType.Red,
      mapType: MapType.Meadow,
    });
    const calls = {
      sprites: [] as Array<[number, number]>,
      animations: [] as Array<[number, number, number]>,
      clickables: [] as boolean[],
      hats: [] as boolean[],
      blocked: [] as boolean[],
      positions: [] as Array<[number, number]>,
      props: [] as number[],
      zOrders: [] as number[],
    };
    const runtime = createProjectionRuntime([ShrewProjection]);
    runtime.mount(ShrewProjection, eid, createShrewNode(calls));
    runtime.mark(world);
    runtime.sync(world);
    Object.values(calls).forEach(values => { values.length = 0; });

    ShrewComponent.hp[eid] += 1;
    ShrewComponent.animTimer[eid] += 1;
    runtime.mark(world);
    runtime.sync(world);

    expect(calls).toEqual({
      sprites: [],
      animations: [],
      clickables: [],
      hats: [],
      blocked: [],
      positions: [],
      props: [],
      zOrders: [],
    });
  });

  it("projects shrew board position and z-order", () => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, [ShrewEntity]);
    const eid = entities.create(ShrewEntity, {
      shrewType: ShrewType.Red,
      mapType: MapType.Meadow,
    });
    const calls = {
      sprites: [] as Array<[number, number]>,
      animations: [] as Array<[number, number, number]>,
      clickables: [] as boolean[],
      hats: [] as boolean[],
      blocked: [] as boolean[],
      positions: [] as Array<[number, number]>,
      props: [] as number[],
      zOrders: [] as number[],
    };
    const runtime = createProjectionRuntime([ShrewProjection]);
    runtime.mount(ShrewProjection, eid, createShrewNode(calls));
    runtime.mark(world);
    runtime.sync(world);
    calls.positions.length = 0;
    calls.zOrders.length = 0;

    BoardPositionComponent.xRatio[eid] = 0.42;
    BoardPositionComponent.yRatio[eid] = 0.63;
    BoardPositionComponent.zIndex[eid] = 5;
    runtime.mark(world);
    runtime.sync(world);

    expect(calls.positions).toHaveLength(1);
    expect(calls.positions[0][0]).toBeCloseTo(0.42, 5);
    expect(calls.positions[0][1]).toBeCloseTo(0.63, 5);
    expect(calls.zOrders).toEqual([5]);
  });

  it("projects shrew blocked-by-occupant visibility override", () => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, [ShrewEntity]);
    const eid = entities.create(ShrewEntity, {
      shrewType: ShrewType.Red,
      mapType: MapType.Meadow,
    });
    const calls = {
      sprites: [] as Array<[number, number]>,
      animations: [] as Array<[number, number, number]>,
      clickables: [] as boolean[],
      hats: [] as boolean[],
      blocked: [] as boolean[],
      positions: [] as Array<[number, number]>,
      props: [] as number[],
      zOrders: [] as number[],
    };
    const runtime = createProjectionRuntime([ShrewProjection]);
    runtime.mount(ShrewProjection, eid, createShrewNode(calls));
    runtime.mark(world);
    runtime.sync(world);
    calls.blocked.length = 0;

    ShrewComponent.blockedByOccupant[eid] = 1;
    runtime.mark(world);
    runtime.sync(world);

    expect(calls.blocked).toEqual([true]);
  });

  it("projects hole position, occupant and z-order", () => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, [HoleEntity]);
    const eid = entities.create(HoleEntity, { index: 0, mapType: MapType.Meadow });
    const calls = {
      positions: [] as Array<[number, number]>,
      occupants: [] as Array<[number, number]>,
      zOrders: [] as number[],
    };
    const node: IHoleNode = {
      setPosition: (x, y) => calls.positions.push([x, y]),
      setOccupant: (kind, eid) => calls.occupants.push([kind, eid]),
      setZOrder: z => calls.zOrders.push(z),
    };
    const runtime = createProjectionRuntime([HoleProjection]);
    runtime.mount(HoleProjection, eid, node);
    runtime.mark(world);
    runtime.sync(world);
    calls.positions.length = calls.occupants.length = calls.zOrders.length = 0;

    HoleComponent.posXRatio[eid] = 0.25;
    HoleComponent.posYRatio[eid] = 0.5;
    HoleComponent.occupantKind[eid] = 1;
    HoleComponent.occupantEid[eid] = 7;
    HoleComponent.zIndex[eid] = 3;
    runtime.mark(world);
    runtime.sync(world);

    expect(calls).toEqual({
      positions: [[0.25, 0.5]],
      occupants: [[1, 7]],
      zOrders: [3],
    });
  });

  it("projects scene map and transition while timer stays view-free", () => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, [SceneEntity]);
    entities.bootstrapSingletons();
    const scene = entities.one(SceneEntity);
    const calls = { maps: [] as number[], transitions: [] as boolean[] };
    const node: ISceneLayer = {
      switchScene: map => calls.maps.push(map),
      setTransitioning: transitioning => calls.transitions.push(transitioning),
    };
    const runtime = createProjectionRuntime([SceneProjection]);
    runtime.mount(SceneProjection, scene, node);
    runtime.mark(world);
    runtime.sync(world);
    calls.maps.length = calls.transitions.length = 0;

    SceneComponent.currentMap[scene] = MapType.Space;
    SceneComponent.sceneTimer[scene] = 12;
    SceneComponent.transitioning[scene] = 1;
    runtime.mark(world);
    runtime.sync(world);

    expect(calls).toEqual({ maps: [MapType.Space], transitions: [true] });
  });
});
