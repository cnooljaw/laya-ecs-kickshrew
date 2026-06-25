import { describe, expect, it } from "vitest";
import { SyncView } from "../../binding/SyncView";
import { createViewSyncRuntime } from "../../binding/ViewSyncRuntime";
import {
  HammerViewSync,
  HoleViewSync,
  SceneViewSync,
  ShrewAnimationViewSync,
  ShrewViewSync,
} from "../../binding/viewSyncs";
import {
  AnimationComponent,
  DirtyComponent,
  HammerComponent,
  HoleComponent,
  SceneComponent,
  ShrewComponent,
} from "../../ecs/components";
import { AnimType, HammerType, MapType, ShrewAction, ShrewType } from "../../ecs/types";
import {
  createGameWorld,
  createHoleEntities,
  createShrewEntity,
  createSingletonEntities,
} from "../../ecs/world";
import {
  BIT_ANIM_PROGRESS,
  BIT_HAMMER_HIT_FEEDBACK,
  BIT_HAMMER_HITTABLE,
  BIT_HAMMER_THUNDER,
  BIT_HAMMER_TYPE,
  BIT_HOLE_POS,
  BIT_HOLE_SHREW,
  BIT_HOLE_ZORDER,
  BIT_SCENE_MAP,
  BIT_SCENE_TIMER,
  BIT_SCENE_TRANSITION,
  BIT_SHREW_HP,
  BIT_SHREW_MAP,
  BIT_SHREW_TIMER,
  BIT_SHREW_TYPE,
} from "../../sync/DirtyFlags";
import type { IHammerNode } from "../../sync/contracts/HammerViewContract";
import type { IHoleNode } from "../../sync/contracts/HoleViewContract";
import type { ISceneLayer } from "../../sync/contracts/SceneViewContract";
import type { IShrewNode } from "../../sync/contracts/ShrewViewContract";
import { dirtyMarkSystem } from "../../sync/dirty/DirtyMarkSystem";
import { HammerEntity } from "../../ecs/gameplay/hammer/HammerEntity";
import { createEntityRuntime } from "../../ecs/runtime/EntityRuntime";
import { HammerProjection } from "../../sync/projections/HammerProjection";
import { createProjectionRuntime } from "../../sync/projection/ProjectionRuntime";

function createShrewNode(calls: {
  spriteFrames?: Array<{ shrewType: number; mapType: number }>;
  animations?: Array<{ actionState: number; animType: number; progress: number }>;
  clickable?: boolean[];
  hats?: boolean[];
  props?: number[];
}): IShrewNode {
  return {
    setSpriteFrame: (shrewType, mapType) => calls.spriteFrames?.push({ shrewType, mapType }),
    setAnimation: (actionState, animType, progress) => {
      calls.animations?.push({ actionState, animType, progress });
    },
    setClickable: (clickable) => calls.clickable?.push(clickable),
    setHatVisible: (visible) => calls.hats?.push(visible),
    setPropType: (propType) => calls.props?.push(propType),
  };
}

describe("core view sync", () => {
  it("compiled hammer projection force-syncs state without playing an empty hit", () => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, [HammerEntity]);
    entities.bootstrapSingletons();
    const hammer = entities.one(HammerEntity);
    const calls = { types: [] as number[], thunder: [] as boolean[], hits: 0 };
    const node: IHammerNode = {
      setHammerType: value => calls.types.push(value),
      setThunderActive: value => calls.thunder.push(value),
      followTouch: () => {},
      playHitAnimation: () => { calls.hits += 1; },
    };
    const runtime = createProjectionRuntime([HammerProjection]);
    runtime.mount(HammerProjection, hammer, node);

    runtime.mark(world);
    runtime.sync(world);

    expect(calls).toEqual({
      types: [HammerType.Wood],
      thunder: [false],
      hits: 0,
    });
  });

  it("compiled hammer projection emits one hit feedback update", () => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, [HammerEntity]);
    entities.bootstrapSingletons();
    const hammer = entities.one(HammerEntity);
    const calls = { positions: [] as Array<[number, number]>, hits: 0 };
    const node: IHammerNode = {
      setHammerType: () => {},
      setThunderActive: () => {},
      followTouch: (x, y) => calls.positions.push([x, y]),
      playHitAnimation: () => { calls.hits += 1; },
    };
    const runtime = createProjectionRuntime([HammerProjection]);
    runtime.mount(HammerProjection, hammer, node);
    runtime.mark(world);
    runtime.sync(world);

    HammerComponent.touchX[hammer] = 123;
    HammerComponent.touchY[hammer] = 456;
    HammerComponent.hitSeq[hammer] = 1;
    runtime.mark(world);
    runtime.sync(world);

    expect(calls).toEqual({
      positions: [[123, 456]],
      hits: 1,
    });
  });

  it("deduplicates sprite projection when type and map change together", () => {
    const world = createGameWorld();
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    const calls = { spriteFrames: [] as Array<{ shrewType: number; mapType: number }> };
    const runtime = createViewSyncRuntime([ShrewViewSync, ShrewAnimationViewSync]);
    runtime.registryFor(ShrewViewSync).register(eid, createShrewNode(calls));

    ShrewComponent.shrewType[eid] = ShrewType.Blue;
    ShrewComponent.mapType[eid] = MapType.Ship;
    runtime.channelFor(ShrewViewSync).project(eid, BIT_SHREW_TYPE | BIT_SHREW_MAP, false);

    expect(calls.spriteFrames).toEqual([{ shrewType: ShrewType.Blue, mapType: MapType.Ship }]);
  });

  it("allows dirty-only shrew fields without a view projection", () => {
    const world = createGameWorld();
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    const calls = {
      spriteFrames: [] as Array<{ shrewType: number; mapType: number }>,
      animations: [] as Array<{ actionState: number; animType: number; progress: number }>,
      clickable: [] as boolean[],
      hats: [] as boolean[],
      props: [] as number[],
    };
    const runtime = createViewSyncRuntime([ShrewViewSync, ShrewAnimationViewSync]);
    runtime.registryFor(ShrewViewSync).register(eid, createShrewNode(calls));

    runtime.channelFor(ShrewViewSync).project(eid, BIT_SHREW_HP | BIT_SHREW_TIMER, false);

    expect(calls).toEqual({
      spriteFrames: [],
      animations: [],
      clickable: [],
      hats: [],
      props: [],
    });
  });

  it("projects animation progress through dirty marking and SyncView", () => {
    const world = createGameWorld();
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    const animations: Array<{ actionState: number; animType: number; progress: number }> = [];
    const runtime = createViewSyncRuntime([ShrewViewSync, ShrewAnimationViewSync]);
    runtime.registryFor(ShrewViewSync).register(eid, createShrewNode({ animations }));
    const syncView = new SyncView();
    syncView.registerChannels(runtime.channels());

    ShrewComponent.actionState[eid] = ShrewAction.Up;
    AnimationComponent.animType[eid] = AnimType.Up;
    AnimationComponent.duration[eid] = 0.31;
    dirtyMarkSystem(world, [ShrewViewSync.dirtyAspect, ShrewAnimationViewSync.dirtyAspect]);
    syncView.sync(world);
    animations.length = 0;

    AnimationComponent.progress[eid] = 0.5;
    dirtyMarkSystem(world, [ShrewViewSync.dirtyAspect, ShrewAnimationViewSync.dirtyAspect]);
    syncView.sync(world);

    expect(DirtyComponent.shrewDirty[eid]).toBe(0);
    expect(animations).toEqual([
      { actionState: ShrewAction.Up, animType: AnimType.Up, progress: 0.5 },
    ]);
  });

  it("projects hole position, occupant and z-order", () => {
    const world = createGameWorld();
    const [eid] = createHoleEntities(world, MapType.Meadow);
    const calls = {
      positions: [] as Array<{ x: number; y: number }>,
      shrews: [] as number[],
      zOrders: [] as number[],
    };
    const node: IHoleNode = {
      setPosition: (x, y) => calls.positions.push({ x, y }),
      setShrewVisible: (shrewEid) => calls.shrews.push(shrewEid),
      setZOrder: (z) => calls.zOrders.push(z),
    };
    const runtime = createViewSyncRuntime([HoleViewSync]);
    runtime.registryFor(HoleViewSync).register(eid, node);

    HoleComponent.posXRatio[eid] = 0.25;
    HoleComponent.posYRatio[eid] = 0.5;
    HoleComponent.shrewEid[eid] = 7;
    HoleComponent.zIndex[eid] = 3;
    runtime.channelFor(HoleViewSync).project(
      eid,
      BIT_HOLE_POS | BIT_HOLE_SHREW | BIT_HOLE_ZORDER,
      false,
    );

    expect(calls).toEqual({
      positions: [{ x: 0.25, y: 0.5 }],
      shrews: [7],
      zOrders: [3],
    });
  });

  it("does not play an empty hammer hit during force-full-sync", () => {
    const world = createGameWorld();
    const { hammer } = createSingletonEntities(world);
    let hits = 0;
    const node: IHammerNode = {
      setHammerType: () => {},
      setThunderActive: () => {},
      followTouch: () => {},
      playHitAnimation: () => { hits += 1; },
    };
    const runtime = createViewSyncRuntime([HammerViewSync]);
    runtime.registryFor(HammerViewSync).register(hammer, node);

    runtime.channelFor(HammerViewSync).project(hammer, 0, true);

    expect(hits).toBe(0);
  });

  it("projects hammer state and hit feedback while hitTable stays dirty-only", () => {
    const world = createGameWorld();
    const { hammer } = createSingletonEntities(world);
    const calls = {
      types: [] as number[],
      thunder: [] as boolean[],
      positions: [] as Array<[number, number]>,
      hits: 0,
    };
    const node: IHammerNode = {
      setHammerType: (hammerType) => calls.types.push(hammerType),
      setThunderActive: (active) => calls.thunder.push(active),
      followTouch: (x, y) => calls.positions.push([x, y]),
      playHitAnimation: () => { calls.hits += 1; },
    };
    const runtime = createViewSyncRuntime([HammerViewSync]);
    runtime.registryFor(HammerViewSync).register(hammer, node);

    HammerComponent.selectedType[hammer] = 4;
    HammerComponent.isThunderActive[hammer] = 1;
    HammerComponent.hitTable[hammer] = 0;
    HammerComponent.touchX[hammer] = 123;
    HammerComponent.touchY[hammer] = 456;
    HammerComponent.hitSeq[hammer] = 1;
    runtime.channelFor(HammerViewSync).project(
      hammer,
      BIT_HAMMER_TYPE | BIT_HAMMER_THUNDER | BIT_HAMMER_HITTABLE | BIT_HAMMER_HIT_FEEDBACK,
      false,
    );

    expect(calls).toEqual({
      types: [4],
      thunder: [true],
      positions: [[123, 456]],
      hits: 1,
    });
  });

  it("projects scene map and transition while timer stays dirty-only", () => {
    const world = createGameWorld();
    const { scene } = createSingletonEntities(world);
    const calls = { maps: [] as number[], transitions: [] as boolean[] };
    const node: ISceneLayer = {
      switchScene: (mapType) => calls.maps.push(mapType),
      setTransitioning: (transitioning) => calls.transitions.push(transitioning),
    };
    const runtime = createViewSyncRuntime([SceneViewSync]);
    runtime.registryFor(SceneViewSync).register(scene, node);

    SceneComponent.currentMap[scene] = MapType.Space;
    SceneComponent.transitioning[scene] = 1;
    SceneComponent.sceneTimer[scene] = 12;
    runtime.channelFor(SceneViewSync).project(
      scene,
      BIT_SCENE_MAP | BIT_SCENE_TRANSITION | BIT_SCENE_TIMER,
      false,
    );

    expect(calls).toEqual({ maps: [MapType.Space], transitions: [true] });
  });
});
