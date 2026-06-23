import { AnimationComponent, DirtyComponent, ShrewComponent } from "../../ecs/components";
import { defineViewSyncModule } from "../../sync/viewSync/ViewSyncModule";
import {
  SHREW_ANIMATION_RULES,
  SHREW_COMPONENT_RULES,
} from "../../sync/rules/ShrewViewRules";
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
  rules: SHREW_COMPONENT_RULES,
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
  rules: SHREW_ANIMATION_RULES,
  project: shrewAnimationViewBinding,
});
