import { AnimationComponent, ShrewComponent } from "../../../ecs/components";
import { AnimType, ShrewAction } from "../../../ecs/types";
import {
  BIT_ANIM_DURATION,
  BIT_ANIM_PROGRESS,
  BIT_ANIM_TYPE,
  BIT_SHREW_ACTION,
  BIT_SHREW_CLICKABLE,
  BIT_SHREW_HAT,
  BIT_SHREW_HP,
  BIT_SHREW_MAP,
  BIT_SHREW_PROP,
  BIT_SHREW_TIMER,
  BIT_SHREW_TYPE,
} from "../../DirtyFlags";
import type { IShrewNode } from "../../contracts/ShrewViewContract";
import { animTypeName, consoleHitTraceLogger } from "../../../debug/HitTraceLogger";
import {
  createSyncRow,
  defineViewSyncSpec,
  noProjection,
  type ViewSyncSpec,
  type ViewSyncContext,
  type ViewSyncRow,
} from "../ViewSyncSpec";
export { applyMatchedViewSyncSpec, bitsOf, createSyncRow, noProjection, row, toDirtyMarks } from "../ViewSyncSpec";

type ComponentField = Extract<keyof typeof ShrewComponent, string>;
type AnimationField = Extract<keyof typeof AnimationComponent, string>;
const shrewRow = createSyncRow<IShrewNode, ComponentField>();
const animationRow = createSyncRow<IShrewNode, AnimationField>();

interface ShrewSyncContext extends ViewSyncContext<IShrewNode> {
  source?: string;
}

export function defineShrewComponentSyncSpec(
  rows: readonly ViewSyncRow<IShrewNode, ComponentField>[],
): ViewSyncSpec<IShrewNode, ComponentField> {
  return defineViewSyncSpec("ShrewComponent", ShrewComponent, rows);
}

function applySpriteFrame({ eid, node }: ShrewSyncContext): void {
  node.setSpriteFrame(ShrewComponent.shrewType[eid], ShrewComponent.mapType[eid]);
}

function applyAnimation({ eid, node, source }: ShrewSyncContext): void {
  if (ShrewComponent.actionState[eid] === ShrewAction.Dizzy) {
    consoleHitTraceLogger.log("binding.dizzyAnimation", {
      eid,
      source: source ?? "shrewSyncSpec",
      actionState: ShrewComponent.actionState[eid],
      animType: AnimationComponent.animType[eid],
      animTypeName: animTypeName(AnimationComponent.animType[eid]),
      progress: AnimationComponent.progress[eid],
      isDizzyAnim: AnimationComponent.animType[eid] === AnimType.Dizzy,
    });
  }
  node.setAnimation(
    ShrewComponent.actionState[eid],
    AnimationComponent.animType[eid],
    AnimationComponent.progress[eid],
  );
}

function applyClickable({ eid, node }: ShrewSyncContext): void {
  node.setClickable(ShrewComponent.isClickable[eid] === 1);
}

function applyHatVisible({ eid, node }: ShrewSyncContext): void {
  node.setHatVisible(ShrewComponent.hasHat[eid] === 1);
}

function applyPropType({ eid, node }: ShrewSyncContext): void {
  node.setPropType(ShrewComponent.propType[eid]);
}

export const SHREW_COMPONENT_SYNC_SPEC = defineShrewComponentSyncSpec([
  // bit                   label          fields             apply
  shrewRow(BIT_SHREW_TYPE,      "地鼠类型",    ["shrewType"],     applySpriteFrame),
  shrewRow(BIT_SHREW_HP,        "地鼠生命值",  ["hp"],            noProjection),
  shrewRow(BIT_SHREW_ACTION,    "动作状态",    ["actionState"],   applyAnimation),
  shrewRow(BIT_SHREW_HAT,       "帽子显示",    ["hasHat"],        applyHatVisible),
  shrewRow(BIT_SHREW_MAP,       "地图皮肤",    ["mapType"],       applySpriteFrame),
  shrewRow(BIT_SHREW_CLICKABLE, "是否可点击",  ["isClickable"],   applyClickable),
  shrewRow(BIT_SHREW_TIMER,     "状态计时器",  ["animTimer"],     noProjection),
  shrewRow(BIT_SHREW_PROP,      "道具类型",    ["propType"],      applyPropType),
]);

export const SHREW_ANIMATION_SYNC_SPEC = defineViewSyncSpec<IShrewNode, AnimationField>(
  "AnimationComponent",
  AnimationComponent,
[
  // bit                 label       fields        apply
  animationRow(BIT_ANIM_TYPE,     "动画类型", ["animType"], applyAnimation),
  animationRow(BIT_ANIM_PROGRESS, "动画进度", ["progress"], applyAnimation),
  animationRow(BIT_ANIM_DURATION, "动画时长", ["duration"], applyAnimation),
]);
