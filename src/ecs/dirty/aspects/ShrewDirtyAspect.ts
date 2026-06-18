import {
  AnimationComponent,
  DirtyComponent,
  ShrewComponent,
} from "../../components";
import {
  SHREW_ANIMATION_RULES,
  SHREW_COMPONENT_RULES,
} from "../../../sync/rules/ShrewViewRules";
import { createRuleDirtyAspect } from "../RuleDirtyAspect";

export const ShrewDirtyAspect = createRuleDirtyAspect({
  name: "ShrewDirtyAspect",
  description: "拥有 ShrewComponent + AnimationComponent + DirtyComponent 的地鼠实体 dirty 映射",
  requires: ["ShrewComponent", "AnimationComponent", "DirtyComponent"],
  components: [ShrewComponent, AnimationComponent, DirtyComponent],
  channels: [
    {
      name: "shrewDirty",
      storeKey: "shrew",
      dirtyTarget: "shrewDirty",
      rules: SHREW_COMPONENT_RULES,
    },
    {
      name: "animDirty",
      storeKey: "anim",
      dirtyTarget: "animDirty",
      rules: SHREW_ANIMATION_RULES,
    },
  ],
});
