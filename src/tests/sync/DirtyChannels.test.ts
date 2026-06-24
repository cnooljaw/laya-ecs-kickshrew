import { describe, expect, it } from "vitest";
import { DirtyComponent } from "../../ecs/components";
import { GAME_FEATURE_REGISTRY } from "../../features/GameFeatures";

describe("Dirty channels", () => {
  it("每个 ViewSyncModule 直接持有对应 DirtyComponent TypedArray", () => {
    for (const sync of GAME_FEATURE_REGISTRY.viewSyncs()) {
      expect(sync.dirtyArray).toBe(DirtyComponent[sync.dirtyTarget]);
      expect(sync.dirtyAspect.channels[0].dirtyArray).toBe(sync.dirtyArray);
    }
  });
});
