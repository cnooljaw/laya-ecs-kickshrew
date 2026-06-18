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
import type { BindingFn } from "./SyncView";
import {
  applyMatchedRules,
  SHREW_ANIMATION_RULES,
  SHREW_COMPONENT_RULES,
} from "./rules/ShrewViewRules";

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

  applyMatchedRules(SHREW_COMPONENT_RULES, {
    eid,
    node,
    dirtyBits,
    forceFull,
    source: "shrewDirty",
  });
};

/** 地鼠动画绑定函数: AnimationComponent.progress 变化时驱动 0.31s 出洞/入洞位移 */
export const shrewAnimationViewBinding: BindingFn = (eid: number, dirtyBits: number, forceFull: boolean) => {
  const node = shrewNodeMap.get(eid);
  if (!node) return;

  applyMatchedRules(SHREW_ANIMATION_RULES, {
    eid,
    node,
    dirtyBits,
    forceFull,
    source: "animDirty",
  });
};
