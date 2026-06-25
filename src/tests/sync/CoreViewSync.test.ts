import { describe, expect, it } from "vitest";
import {
  AnimationComponent,
  HoleComponent,
  SceneComponent,
  ShrewComponent,
} from "../../ecs/components";
import {
  HoleEntity,
  SceneEntity,
  ShrewEntity,
} from "../../ecs/gameplay/core/CoreEntities";
import { createEntityRuntime } from "../../framework/ecs/EntityRuntime";
import { AnimType, MapType, ShrewAction, ShrewType } from "../../ecs/types";
import { createGameWorld } from "../../ecs/world";
import type { IHoleNode } from "../../sync/contracts/HoleViewContract";
import type { ISceneLayer } from "../../sync/contracts/SceneViewContract";
import type { IShrewNode } from "../../sync/contracts/ShrewViewContract";
import { createProjectionRuntime } from "../../framework/sync/ProjectionRuntime";
import {
  HoleProjection,
  SceneProjection,
  ShrewProjection,
} from "../../sync/projections/CoreProjections";

function createShrewNode(calls: {
  sprites: Array<[number, number]>;
  animations: Array<[number, number, number]>;
  clickables: boolean[];
  hats: boolean[];
  props: number[];
}): IShrewNode {
  return {
    setSpriteFrame: (type, map) => calls.sprites.push([type, map]),
    setAnimation: (action, animation, progress) => {
      calls.animations.push([action, animation, progress]);
    },
    setClickable: clickable => calls.clickables.push(clickable),
    setHatVisible: visible => calls.hats.push(visible),
    setPropType: propType => calls.props.push(propType),
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
      props: [] as number[],
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
      props: [] as number[],
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
      props: [],
    });
  });

  it("projects hole position, occupant and z-order", () => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, [HoleEntity]);
    const eid = entities.create(HoleEntity, { index: 0, mapType: MapType.Meadow });
    const calls = {
      positions: [] as Array<[number, number]>,
      shrews: [] as number[],
      zOrders: [] as number[],
    };
    const node: IHoleNode = {
      setPosition: (x, y) => calls.positions.push([x, y]),
      setShrewVisible: shrewEid => calls.shrews.push(shrewEid),
      setZOrder: z => calls.zOrders.push(z),
    };
    const runtime = createProjectionRuntime([HoleProjection]);
    runtime.mount(HoleProjection, eid, node);
    runtime.mark(world);
    runtime.sync(world);
    calls.positions.length = calls.shrews.length = calls.zOrders.length = 0;

    HoleComponent.posXRatio[eid] = 0.25;
    HoleComponent.posYRatio[eid] = 0.5;
    HoleComponent.shrewEid[eid] = 7;
    HoleComponent.zIndex[eid] = 3;
    runtime.mark(world);
    runtime.sync(world);

    expect(calls).toEqual({
      positions: [[0.25, 0.5]],
      shrews: [7],
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
