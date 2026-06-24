import { AnimationComponent, DirtyComponent, ShrewComponent } from "../../ecs/components";
import { defineViewSyncModule } from "../../sync/viewSync/ViewSyncModule";
import {
  SHREW_ANIMATION_SYNC_SPEC,
  SHREW_COMPONENT_SYNC_SPEC,
} from "../../sync/viewSync/specs/ShrewViewSyncSpec";
import {
  shrewAnimationViewBinding,
  shrewViewBinding,
} from "../ShrewViewBinding";

const shrewRequires = ["ShrewComponent", "AnimationComponent", "DirtyComponent"];
const shrewComponents = [ShrewComponent, AnimationComponent, DirtyComponent];

export const ShrewViewSync = defineViewSyncModule({
  name: "shrew",
  aspectName: "ShrewDirtyAspect",
  description: "拥有 ShrewComponent + AnimationComponent + DirtyComponent 的地鼠实体 dirty 映射",
  requires: shrewRequires,
  components: shrewComponents,
  storeKey: "shrew",
  dirtyTarget: "shrewDirty",
  spec: SHREW_COMPONENT_SYNC_SPEC,
  project: shrewViewBinding,
});

export const ShrewAnimationViewSync = defineViewSyncModule({
  name: "anim",
  aspectName: "ShrewAnimationDirtyAspect",
  description: "拥有 ShrewComponent + AnimationComponent + DirtyComponent 的地鼠动画 dirty 映射",
  requires: shrewRequires,
  components: shrewComponents,
  storeKey: "anim",
  dirtyTarget: "animDirty",
  spec: SHREW_ANIMATION_SYNC_SPEC,
  project: shrewAnimationViewBinding,
});
