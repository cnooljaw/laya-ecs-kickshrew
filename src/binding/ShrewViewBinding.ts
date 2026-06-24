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
  SHREW_ANIMATION_SYNC_SPEC,
  SHREW_COMPONENT_SYNC_SPEC,
} from "../sync/viewSync/specs/ShrewViewSyncSpec";
import { createViewSyncBinding, createViewNodeRegistry } from "./ViewSyncBinding";
import type { IShrewNode } from "../sync/contracts/ShrewViewContract";

const shrewRegistry = createViewNodeRegistry<IShrewNode>();

/** 注册地鼠视图节点 */
export const registerShrewNode = shrewRegistry.register;

/** 移除地鼠视图节点 */
export const unregisterShrewNode = shrewRegistry.unregister;

/** 地鼠视图绑定函数 */
export const shrewViewBinding: BindingFn = createViewSyncBinding(shrewRegistry, SHREW_COMPONENT_SYNC_SPEC, "shrewDirty");

/** 地鼠动画绑定函数: AnimationComponent.progress 变化时驱动 0.31s 出洞/入洞位移 */
export const shrewAnimationViewBinding: BindingFn = createViewSyncBinding(shrewRegistry, SHREW_ANIMATION_SYNC_SPEC, "animDirty");
