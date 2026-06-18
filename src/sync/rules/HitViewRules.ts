import { HitComponent } from "../../ecs/components";
import {
  BIT_HIT_INDEX,
  BIT_HIT_REWARD,
  BIT_HIT_WASHIT,
} from "../../binding/DirtyFlags";
import type { IHitEffectNode } from "../../binding/HitViewBinding";
import { createRule, defineViewRules } from "./ViewBindingRule";

type HitField = Extract<keyof typeof HitComponent, string>;
const rule = createRule<IHitEffectNode, HitField>();

function applyHitEffect({ eid, node }: { eid: number; node: IHitEffectNode }): void {
  if (HitComponent.wasHit[eid] === 1) {
    node.showReward(HitComponent.shrewIndex[eid], HitComponent.reward[eid]);
  } else {
    node.showMiss();
  }
}

export const HIT_VIEW_RULES = defineViewRules<IHitEffectNode, HitField>(
  "HitComponent",
  HitComponent,
  [
    // bit             label          fields         apply
    rule(BIT_HIT_INDEX,  "命中地鼠索引", ["shrewIndex"], applyHitEffect),
    rule(BIT_HIT_REWARD, "命中奖励",     ["reward"],     applyHitEffect),
    rule(BIT_HIT_WASHIT, "是否命中",     ["wasHit"],     applyHitEffect),
  ],
);
