import { describe, it, expect, afterEach } from "vitest";
import type { IShrewNode } from "../../sync/contracts/ShrewViewContract";
import { createGameWorld, createShrewEntity } from "../../ecs/world";
import { AnimationComponent, DirtyComponent, ShrewComponent } from "../../ecs/components";
import { dirtyMarkSystem } from "../../ecs/systems/DirtyMarkSystem";
import { SyncView } from "../../binding/SyncView";
import {
  registerShrewNode,
  shrewAnimationViewBinding,
  shrewViewBinding,
  unregisterShrewNode,
} from "../../binding/ShrewViewBinding";
import {
  BIT_ANIM_PROGRESS,
  BIT_SHREW_HP,
  BIT_SHREW_MAP,
  BIT_SHREW_TIMER,
  BIT_SHREW_TYPE,
} from "../../sync/DirtyFlags";
import { AnimType, MapType, ShrewAction, ShrewType } from "../../ecs/types";

describe("ShrewViewBinding", () => {
  const registered: number[] = [];

  afterEach(() => {
    for (const eid of registered) {
      unregisterShrewNode(eid);
    }
    registered.length = 0;
  });

  function createNode(calls: {
    spriteFrames?: Array<{ shrewType: number; mapType: number }>;
    animations?: Array<{ actionState: number; animType: number; progress: number }>;
    clickable?: boolean[];
    hats?: boolean[];
    props?: number[];
  }): IShrewNode {
    return {
      setSpriteFrame: (shrewType, mapType) => {
        calls.spriteFrames?.push({ shrewType, mapType });
      },
      setAnimation: (actionState, animType, progress) => {
        calls.animations?.push({ actionState, animType, progress });
      },
      setClickable: (clickable) => {
        calls.clickable?.push(clickable);
      },
      setHatVisible: (visible) => {
        calls.hats?.push(visible);
      },
      setPropType: (propType) => {
        calls.props?.push(propType);
      },
    };
  }

  it("shrewDirty 表格规则根据 type/map dirty bit 投影 spriteFrame 且同帧去重", () => {
    const world = createGameWorld();
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    const calls = { spriteFrames: [] as Array<{ shrewType: number; mapType: number }> };
    const node = createNode(calls);
    registerShrewNode(eid, node);
    registered.push(eid);

    ShrewComponent.shrewType[eid] = ShrewType.Blue;
    ShrewComponent.mapType[eid] = MapType.Ship;

    shrewViewBinding(eid, BIT_SHREW_TYPE | BIT_SHREW_MAP, false);

    expect(calls.spriteFrames).toEqual([
      { shrewType: ShrewType.Blue, mapType: MapType.Ship },
    ]);
  });

  it("shrewDirty 表格规则允许无 view 投影的字段只参与 dirty 标记", () => {
    const world = createGameWorld();
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    const calls = {
      spriteFrames: [] as Array<{ shrewType: number; mapType: number }>,
      animations: [] as Array<{ actionState: number; animType: number; progress: number }>,
      clickable: [] as boolean[],
      hats: [] as boolean[],
      props: [] as number[],
    };
    const node = createNode(calls);
    registerShrewNode(eid, node);
    registered.push(eid);

    shrewViewBinding(eid, BIT_SHREW_HP | BIT_SHREW_TIMER, false);

    expect(calls.spriteFrames).toEqual([]);
    expect(calls.animations).toEqual([]);
    expect(calls.clickable).toEqual([]);
    expect(calls.hats).toEqual([]);
    expect(calls.props).toEqual([]);
  });

  it("AnimationComponent.progress 变化时通过 animDirty 驱动地鼠位移同步", () => {
    const world = createGameWorld();
    const eid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
    const animationCalls: Array<{ actionState: number; animType: number; progress: number }> = [];
    const node: IShrewNode = {
      setSpriteFrame: () => {},
      setAnimation: (actionState, animType, progress) => {
        animationCalls.push({ actionState, animType, progress });
      },
      setClickable: () => {},
      setHatVisible: () => {},
      setPropType: () => {},
    };
    registerShrewNode(eid, node);
    registered.push(eid);

    const syncView = new SyncView();
    syncView.registerAnimBinding(shrewAnimationViewBinding);

    ShrewComponent.actionState[eid] = ShrewAction.Up;
    AnimationComponent.animType[eid] = AnimType.Up;
    AnimationComponent.duration[eid] = 0.31;
    AnimationComponent.progress[eid] = 0;
    dirtyMarkSystem(world);
    syncView.sync(world);
    animationCalls.length = 0;

    AnimationComponent.progress[eid] = 0.5;
    dirtyMarkSystem(world);

    expect(DirtyComponent.shrewDirty[eid]).toBe(0);
    expect(DirtyComponent.animDirty[eid] & BIT_ANIM_PROGRESS).toBeTruthy();

    syncView.sync(world);

    expect(animationCalls).toEqual([
      { actionState: ShrewAction.Up, animType: AnimType.Up, progress: 0.5 },
    ]);
  });
});
