/**
 * ShrewViewBinding — ShrewComponent → ShrewNode 绑定
 *
 * 读取 ShrewComponent 的脏标记，更新 Laya ShrewNode 的:
 * - sprite 帧 (shrewType/mapType 变化)
 * - 动画状态 (actionState 变化)
 * - 可见性/可交互 (isClickable)
 * - 帽子显示 (hasHat)
 * - 道具 (propType)
 */
import { ShrewComponent, AnimationComponent } from "../ecs/components";
import {
  BIT_SHREW_TYPE, BIT_SHREW_ACTION,
  BIT_SHREW_HAT, BIT_SHREW_MAP, BIT_SHREW_CLICKABLE,
  BIT_SHREW_PROP,
  BIT_ANIM_TYPE, BIT_ANIM_PROGRESS, BIT_ANIM_DURATION,
} from "./DirtyFlags";
import type { BindingFn } from "./SyncView";
import { AnimType, ShrewAction } from "../ecs/types";
import { animTypeName, consoleHitTraceLogger } from "../debug/HitTraceLogger";

/** 地鼠视图节点接口 (由 Laya ShrewNode 实现) */
export interface IShrewNode {
  setSpriteFrame(shrewType: number, mapType: number): void;
  setAnimation(actionState: number, animType: number, progress: number): void;
  setClickable(clickable: boolean): void;
  setHatVisible(visible: boolean): void;
  setPropType(propType: number): void;
}

/** 地鼠 eid → 视图节点 映射 */
const shrewNodeMap = new Map<number, IShrewNode>();

/** 注册地鼠视图节点 */
export function registerShrewNode(eid: number, node: IShrewNode): void {
  shrewNodeMap.set(eid, node);
}

/** 移除地鼠视图节点 */
export function unregisterShrewNode(eid: number): void {
  shrewNodeMap.delete(eid);
}

/** 地鼠视图绑定函数 */
export const shrewViewBinding: BindingFn = (eid: number, dirtyBits: number, forceFull: boolean) => {
  const node = shrewNodeMap.get(eid);
  if (!node) return;

  if (forceFull || (dirtyBits & BIT_SHREW_TYPE) || (dirtyBits & BIT_SHREW_MAP)) {
    node.setSpriteFrame(ShrewComponent.shrewType[eid], ShrewComponent.mapType[eid]);
  }

  if (forceFull || (dirtyBits & BIT_SHREW_ACTION)) {
    if (ShrewComponent.actionState[eid] === ShrewAction.Dizzy) {
      consoleHitTraceLogger.log("binding.dizzyAnimation", {
        eid,
        source: "shrewDirty",
        actionState: ShrewComponent.actionState[eid],
        animType: AnimationComponent.animType[eid],
        animTypeName: animTypeName(AnimationComponent.animType[eid]),
        progress: AnimationComponent.progress[eid],
        isDizzyAnim: AnimationComponent.animType[eid] === AnimType.Dizzy,
      });
    }
    node.setAnimation(ShrewComponent.actionState[eid], AnimationComponent.animType[eid], AnimationComponent.progress[eid]);
  }

  if (forceFull || (dirtyBits & BIT_SHREW_CLICKABLE)) {
    node.setClickable(ShrewComponent.isClickable[eid] === 1);
  }

  if (forceFull || (dirtyBits & BIT_SHREW_HAT)) {
    node.setHatVisible(ShrewComponent.hasHat[eid] === 1);
  }

  if (forceFull || (dirtyBits & BIT_SHREW_PROP)) {
    node.setPropType(ShrewComponent.propType[eid]);
  }
};

/** 地鼠动画绑定函数: AnimationComponent.progress 变化时驱动 0.31s 出洞/入洞位移 */
export const shrewAnimationViewBinding: BindingFn = (eid: number, dirtyBits: number, forceFull: boolean) => {
  const node = shrewNodeMap.get(eid);
  if (!node) return;

  const animationDirty = BIT_ANIM_TYPE | BIT_ANIM_PROGRESS | BIT_ANIM_DURATION;
  if (forceFull || (dirtyBits & animationDirty)) {
    if (ShrewComponent.actionState[eid] === ShrewAction.Dizzy) {
      consoleHitTraceLogger.log("binding.dizzyAnimation", {
        eid,
        source: "animDirty",
        actionState: ShrewComponent.actionState[eid],
        animType: AnimationComponent.animType[eid],
        animTypeName: animTypeName(AnimationComponent.animType[eid]),
        progress: AnimationComponent.progress[eid],
        isDizzyAnim: AnimationComponent.animType[eid] === AnimType.Dizzy,
      });
    }
    node.setAnimation(ShrewComponent.actionState[eid], AnimationComponent.animType[eid], AnimationComponent.progress[eid]);
  }
};
