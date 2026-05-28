import { describe, it, expect, afterEach } from "vitest";
import { createGameWorld, createShrewEntity } from "../../ecs/world";
import { AnimationComponent, DirtyComponent, ShrewComponent } from "../../ecs/components";
import { dirtyMarkSystem } from "../../ecs/systems/DirtyMarkSystem";
import { SyncView } from "../../binding/SyncView";
import {
  registerShrewNode,
  shrewAnimationViewBinding,
  unregisterShrewNode,
  type IShrewNode,
} from "../../binding/ShrewViewBinding";
import { BIT_ANIM_PROGRESS } from "../../binding/DirtyFlags";
import { AnimType, MapType, ShrewAction, ShrewType } from "../../ecs/types";

describe("ShrewViewBinding", () => {
  const registered: number[] = [];

  afterEach(() => {
    for (const eid of registered) {
      unregisterShrewNode(eid);
    }
    registered.length = 0;
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
