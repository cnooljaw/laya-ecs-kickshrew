import { describe, expect, it } from "vitest";
import {
  HammerViewSync,
  HitViewSync,
  HoleViewSync,
  MonsterViewSync,
  PerfHeroViewSync,
  PlayerViewSync,
  SceneViewSync,
  ShrewAnimationViewSync,
  ShrewViewSync,
} from "../../binding/viewSyncs";
import { DirtyComponent, SceneComponent } from "../../ecs/components";
import { GAME_FEATURE_REGISTRY } from "../../features/GameFeatures";
import { createViewSyncDirtyAspect } from "../../sync/dirty/ViewSyncDirtyAspect";
import { bitsOf } from "../../sync/viewSync/ViewSyncSpec";
import { HAMMER_VIEW_SYNC_SPEC } from "../../sync/viewSync/specs/HammerViewSyncSpec";
import { HIT_VIEW_SYNC_SPEC } from "../../sync/viewSync/specs/HitViewSyncSpec";
import { HOLE_VIEW_SYNC_SPEC } from "../../sync/viewSync/specs/HoleViewSyncSpec";
import { MONSTER_VIEW_SYNC_SPEC } from "../../sync/viewSync/specs/MonsterViewSyncSpec";
import { PERF_HERO_VIEW_SYNC_SPEC } from "../../sync/viewSync/specs/PerfHeroViewSyncSpec";
import { PLAYER_VIEW_SYNC_SPEC } from "../../sync/viewSync/specs/PlayerViewSyncSpec";
import { SCENE_VIEW_SYNC_SPEC } from "../../sync/viewSync/specs/SceneViewSyncSpec";
import {
  SHREW_ANIMATION_SYNC_SPEC,
  SHREW_COMPONENT_SYNC_SPEC,
} from "../../sync/viewSync/specs/ShrewViewSyncSpec";

const MODULE_CASES = [
  { module: ShrewViewSync, spec: SHREW_COMPONENT_SYNC_SPEC },
  { module: ShrewAnimationViewSync, spec: SHREW_ANIMATION_SYNC_SPEC },
  { module: HoleViewSync, spec: HOLE_VIEW_SYNC_SPEC },
  { module: HammerViewSync, spec: HAMMER_VIEW_SYNC_SPEC },
  { module: SceneViewSync, spec: SCENE_VIEW_SYNC_SPEC },
  { module: PlayerViewSync, spec: PLAYER_VIEW_SYNC_SPEC },
  { module: HitViewSync, spec: HIT_VIEW_SYNC_SPEC },
  { module: PerfHeroViewSync, spec: PERF_HERO_VIEW_SYNC_SPEC },
  { module: MonsterViewSync, spec: MONSTER_VIEW_SYNC_SPEC },
] as const;

describe("ViewSync module metadata", () => {
  it.each(MODULE_CASES)("$module.name derives dirty metadata from its spec", ({ module, spec }) => {
    const channel = module.dirtyAspect.channels.find(
      (candidate) => candidate.dirtyTarget === module.dirtyTarget,
    );

    expect(channel).toBeDefined();
    expect(module.dirtyArray).toBe(DirtyComponent[module.dirtyTarget]);
    expect(channel?.dirtyArray).toBe(module.dirtyArray);
    expect(module.watchedBits).toBe(bitsOf(spec));
    expect(channel?.allBits).toBe(bitsOf(spec));
    expect(channel?.marks.map((mark) => mark.bit)).toEqual(spec.map((row) => row.bit));
    expect(channel?.marks.map((mark) => mark.fields.map((field) => field.path))).toEqual(
      spec.map((row) => row.dirtyFields.map((field) => field.path)),
    );
    expect(channel?.marks.every((mark) => !("viewTarget" in mark))).toBe(true);
  });

  it("feature registry exposes each module's own dirty array", () => {
    for (const sync of GAME_FEATURE_REGISTRY.viewSyncs()) {
      expect(sync.dirtyArray).toBe(DirtyComponent[sync.dirtyTarget]);
      expect(sync.dirtyAspect.channels[0].dirtyArray).toBe(sync.dirtyArray);
    }
  });

  it("creates a dirty aspect from component and spec declarations", () => {
    const aspect = createViewSyncDirtyAspect({
      name: "TestSceneDirtyAspect",
      description: "test scene dirty mapping",
      components: [SceneComponent, DirtyComponent],
      requires: ["SceneComponent", "DirtyComponent"],
      channel: {
        name: "sceneDirty",
        dirtyTarget: "sceneDirty",
        spec: SCENE_VIEW_SYNC_SPEC,
      },
    });

    expect(aspect.requires).toEqual(["SceneComponent", "DirtyComponent"]);
    expect(aspect.channels).toHaveLength(1);
    expect(aspect.channels[0].dirtyArray).toBe(DirtyComponent.sceneDirty);
    expect(aspect.channels[0].allBits).toBe(bitsOf(SCENE_VIEW_SYNC_SPEC));
  });
});
