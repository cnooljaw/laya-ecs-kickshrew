import { HitComponent } from "../../ecs/components";
import {
  BIT_HIT_INDEX,
  BIT_HIT_REWARD,
  BIT_HIT_WASHIT,
} from "../DirtyFlags";
import type { IHitEffectNode } from "../HitViewBinding";
import { defineViewRules, row } from "./ViewBindingRule";

type HitField = Extract<keyof typeof HitComponent, string>;

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
    row<IHitEffectNode, HitField>(BIT_HIT_INDEX,  "命中地鼠索引", ["shrewIndex"], applyHitEffect),
    row<IHitEffectNode, HitField>(BIT_HIT_REWARD, "命中奖励",     ["reward"],     applyHitEffect),
    row<IHitEffectNode, HitField>(BIT_HIT_WASHIT, "是否命中",     ["wasHit"],     applyHitEffect),
  ],
);
