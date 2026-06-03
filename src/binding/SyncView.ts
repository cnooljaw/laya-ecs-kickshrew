/**
 * SyncView — 主同步器: 读 DirtyComponent → 调对应 Binding → 清标记
 *
 * 每帧在所有 ECS 系统之后执行:
 * 1. 遍历所有有 DirtyComponent 的实体
 * 2. 读取各组件的 dirty bitmask
 * 3. forceFullSync 时跳过 bit 检查，全量同步
 * 4. 调用对应 Binding 函数更新 Laya 节点
 * 5. 同步完成后清除 dirty bits
 *
 * 注意: SyncView 依赖 Laya 运行时，视图节点由外部注入。
 */
import { defineQuery } from "bitecs";
import { DirtyComponent } from "../ecs/components";
import {
  BIT_SHREW_ALL,
  BIT_HOLE_ALL,
  BIT_HAMMER_ALL,
  BIT_COMBO_ALL,
  BIT_SCENE_ALL,
  BIT_PLAYER_ALL,
  BIT_ANIM_ALL,
  BIT_HIT_ALL,
  BIT_PERF_LADYBIRD_ALL,
} from "./DirtyFlags";

const dirtyQuery = defineQuery([DirtyComponent]);

/** 视图绑定函数类型 */
export type BindingFn = (eid: number, dirtyBits: number, forceFull: boolean) => void;

/**
 * SyncView 同步器
 * 管理所有 Binding 函数，按帧执行同步
 */
export class SyncView {
  private shrewBinding: BindingFn | null = null;
  private holeBinding: BindingFn | null = null;
  private hammerBinding: BindingFn | null = null;
  private comboBinding: BindingFn | null = null;
  private sceneBinding: BindingFn | null = null;
  private playerBinding: BindingFn | null = null;
  private animBinding: BindingFn | null = null;
  private hitBinding: BindingFn | null = null;
  private perfLadybirdBinding: BindingFn | null = null;

  /** 注册地鼠绑定 */
  registerShrewBinding(fn: BindingFn): void { this.shrewBinding = fn; }
  /** 注册洞位绑定 */
  registerHoleBinding(fn: BindingFn): void { this.holeBinding = fn; }
  /** 注册锤子绑定 */
  registerHammerBinding(fn: BindingFn): void { this.hammerBinding = fn; }
  /** 注册连击绑定 */
  registerComboBinding(fn: BindingFn): void { this.comboBinding = fn; }
  /** 注册场景绑定 */
  registerSceneBinding(fn: BindingFn): void { this.sceneBinding = fn; }
  /** 注册玩家绑定 */
  registerPlayerBinding(fn: BindingFn): void { this.playerBinding = fn; }
  /** 注册动画绑定 */
  registerAnimBinding(fn: BindingFn): void { this.animBinding = fn; }
  /** 注册击中绑定 */
  registerHitBinding(fn: BindingFn): void { this.hitBinding = fn; }
  /** 注册调试压测小瓢虫绑定 */
  registerPerfLadybirdBinding(fn: BindingFn): void { this.perfLadybirdBinding = fn; }

  /**
   * 执行同步: 遍历所有脏实体，调用对应 Binding，然后清除标记
   */
  sync(world: any): void {
    const entities = dirtyQuery(world);

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      const forceFull = DirtyComponent.forceFullSync[eid] === 1;

      // Shrew 绑定
      const shrewDirty = DirtyComponent.shrewDirty[eid];
      if ((shrewDirty & BIT_SHREW_ALL) || forceFull) {
        this.shrewBinding?.(eid, shrewDirty, forceFull);
      }

      // Hole 绑定
      const holeDirty = DirtyComponent.holeDirty[eid];
      if ((holeDirty & BIT_HOLE_ALL) || forceFull) {
        this.holeBinding?.(eid, holeDirty, forceFull);
      }

      // Hammer 绑定
      const hammerDirty = DirtyComponent.hammerDirty[eid];
      if ((hammerDirty & BIT_HAMMER_ALL) || forceFull) {
        this.hammerBinding?.(eid, hammerDirty, forceFull);
      }

      // Combo 绑定
      const comboDirty = DirtyComponent.comboDirty[eid];
      if ((comboDirty & BIT_COMBO_ALL) || forceFull) {
        this.comboBinding?.(eid, comboDirty, forceFull);
      }

      // Scene 绑定
      const sceneDirty = DirtyComponent.sceneDirty[eid];
      if ((sceneDirty & BIT_SCENE_ALL) || forceFull) {
        this.sceneBinding?.(eid, sceneDirty, forceFull);
      }

      // Player 绑定
      const playerDirty = DirtyComponent.playerDirty[eid];
      if ((playerDirty & BIT_PLAYER_ALL) || forceFull) {
        this.playerBinding?.(eid, playerDirty, forceFull);
      }

      // Anim 绑定
      const animDirty = DirtyComponent.animDirty[eid];
      if ((animDirty & BIT_ANIM_ALL) || forceFull) {
        this.animBinding?.(eid, animDirty, forceFull);
      }

      // Hit 绑定
      const hitDirty = DirtyComponent.hitDirty[eid];
      if ((hitDirty & BIT_HIT_ALL) || forceFull) {
        this.hitBinding?.(eid, hitDirty, forceFull);
      }

      // 调试压测小瓢虫绑定
      const perfLadybirdDirty = DirtyComponent.perfLadybirdDirty[eid];
      if ((perfLadybirdDirty & BIT_PERF_LADYBIRD_ALL) || forceFull) {
        this.perfLadybirdBinding?.(eid, perfLadybirdDirty, forceFull);
      }

      // 清除 dirty bits (forceFullSync 也清除)
      DirtyComponent.shrewDirty[eid] = 0;
      DirtyComponent.holeDirty[eid] = 0;
      DirtyComponent.hammerDirty[eid] = 0;
      DirtyComponent.comboDirty[eid] = 0;
      DirtyComponent.sceneDirty[eid] = 0;
      DirtyComponent.playerDirty[eid] = 0;
      DirtyComponent.animDirty[eid] = 0;
      DirtyComponent.hitDirty[eid] = 0;
      DirtyComponent.perfLadybirdDirty[eid] = 0;
      DirtyComponent.forceFullSync[eid] = 0;
    }
  }
}
