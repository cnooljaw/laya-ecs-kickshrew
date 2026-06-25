import { addComponent, addEntity } from "bitecs";
import { beforeEach, describe, expect, it } from "vitest";
import {
  AnimationComponent,
  DirtyComponent,
  HitComponent,
  HoleComponent,
  PlayerComponent,
  SceneComponent,
  ShrewComponent,
} from "../../ecs/components";
import { MapType, ShrewAction, ShrewType } from "../../ecs/types";
import {
  createGameWorld,
  createHoleEntities,
  createShrewEntity,
  createSingletonEntities,
} from "../../ecs/world";
import { GAME_FEATURE_REGISTRY } from "../../features/GameFeatures";
import {
  BIT_ANIM_TYPE,
  BIT_HIT_INDEX,
  BIT_HIT_REWARD,
  BIT_HIT_WASHIT,
  BIT_HOLE_POS,
  BIT_HOLE_SHREW,
  BIT_HOLE_ZORDER,
  BIT_PLAYER_ANGRY,
  BIT_PLAYER_LEVEL,
  BIT_PLAYER_MONEY,
  BIT_PLAYER_POWER,
  BIT_SCENE_MAP,
  BIT_SCENE_TIMER,
  BIT_SCENE_TRANSITION,
  BIT_SHREW_ACTION,
  BIT_SHREW_HP,
  BIT_SHREW_TYPE,
} from "../../sync/DirtyFlags";
import {
  dirtyMarkSystem,
  getDirtySnapshotForTest,
} from "../../sync/dirty/DirtyMarkSystem";

describe("DirtyMarkSystem", () => {
  let world: ReturnType<typeof createGameWorld>;

  beforeEach(() => {
    world = createGameWorld();
  });

  function markDirty(): void {
    dirtyMarkSystem(world, GAME_FEATURE_REGISTRY.dirtyAspects());
  }

  it("marks all watched fields on the first frame and clears unchanged fields next frame", () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);

    markDirty();
    expect(DirtyComponent.shrewDirty[eid]).not.toBe(0);
    expect(DirtyComponent.animDirty[eid]).not.toBe(0);

    markDirty();
    expect(DirtyComponent.shrewDirty[eid]).toBe(0);
    expect(DirtyComponent.animDirty[eid]).toBe(0);
  });

  it("reuses snapshots across frames", () => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);

    markDirty();
    const snapshot = getDirtySnapshotForTest(world, "shrew", eid);
    ShrewComponent.hp[eid] -= 1;
    markDirty();

    expect(snapshot).toBeTruthy();
    expect(getDirtySnapshotForTest(world, "shrew", eid)).toBe(snapshot);
  });

  it.each([
    {
      field: "shrew type",
      mutate: (eid: number) => { ShrewComponent.shrewType[eid] = ShrewType.Blue; },
      bit: BIT_SHREW_TYPE,
    },
    {
      field: "shrew hp",
      mutate: (eid: number) => { ShrewComponent.hp[eid] = 0; },
      bit: BIT_SHREW_HP,
    },
    {
      field: "shrew action",
      mutate: (eid: number) => { ShrewComponent.actionState[eid] = ShrewAction.Up; },
      bit: BIT_SHREW_ACTION,
    },
    {
      field: "animation type",
      mutate: (eid: number) => { AnimationComponent.animType[eid] += 1; },
      bit: BIT_ANIM_TYPE,
      target: "animDirty" as const,
    },
  ])("maps $field changes to its exact bit", ({ mutate, bit, target = "shrewDirty" as const }) => {
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    markDirty();

    mutate(eid);
    markDirty();

    expect(DirtyComponent[target][eid]).toBe(bit);
  });

  it("combines hole field changes", () => {
    const [eid] = createHoleEntities(world, MapType.Meadow);
    markDirty();

    HoleComponent.posXRatio[eid] += 0.01;
    HoleComponent.shrewEid[eid] = 99;
    HoleComponent.zIndex[eid] += 1;
    markDirty();

    expect(DirtyComponent.holeDirty[eid]).toBe(BIT_HOLE_POS | BIT_HOLE_SHREW | BIT_HOLE_ZORDER);
  });

  it("combines scene and player field changes without clearing force-full-sync", () => {
    const { scene, player } = createSingletonEntities(world);
    markDirty();

    SceneComponent.currentMap[scene] = MapType.Ship;
    SceneComponent.sceneTimer[scene] = 1;
    SceneComponent.transitioning[scene] = 1;
    PlayerComponent.money[player] = 100;
    PlayerComponent.angry[player] = 50;
    PlayerComponent.power[player] = 10;
    PlayerComponent.powerTop[player] = 100;
    PlayerComponent.level[player] = 2;
    DirtyComponent.forceFullSync[scene] = 1;
    markDirty();

    expect(DirtyComponent.sceneDirty[scene]).toBe(BIT_SCENE_MAP | BIT_SCENE_TIMER | BIT_SCENE_TRANSITION);
    expect(DirtyComponent.playerDirty[player]).toBe(
      BIT_PLAYER_MONEY | BIT_PLAYER_ANGRY | BIT_PLAYER_POWER | BIT_PLAYER_LEVEL,
    );
    expect(DirtyComponent.forceFullSync[scene]).toBe(1);
  });

  it("combines hit result changes", () => {
    const eid = addEntity(world);
    addComponent(world, HitComponent, eid);
    addComponent(world, DirtyComponent, eid);
    markDirty();

    HitComponent.shrewIndex[eid] = 3;
    HitComponent.reward[eid] = 50;
    HitComponent.wasHit[eid] = 1;
    markDirty();

    expect(DirtyComponent.hitDirty[eid]).toBe(BIT_HIT_INDEX | BIT_HIT_REWARD | BIT_HIT_WASHIT);
  });
});
