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
import { bitsOf } from "../sync/rules/ViewBindingRule";
import { SHREW_ANIMATION_RULES, SHREW_COMPONENT_RULES } from "../sync/rules/ShrewViewRules";
import { HOLE_VIEW_RULES } from "../sync/rules/HoleViewRules";
import { HAMMER_VIEW_RULES } from "../sync/rules/HammerViewRules";
import { COMBO_VIEW_RULES } from "../sync/rules/ComboViewRules";
import { SCENE_VIEW_RULES } from "../sync/rules/SceneViewRules";
import { PLAYER_VIEW_RULES } from "../sync/rules/PlayerViewRules";
import { HIT_VIEW_RULES } from "../sync/rules/HitViewRules";
import { PERF_HERO_VIEW_RULES } from "../sync/rules/PerfHeroViewRules";

const dirtyQuery = defineQuery([DirtyComponent]);
const SHREW_DIRTY_MASK = bitsOf(SHREW_COMPONENT_RULES);
const ANIM_DIRTY_MASK = bitsOf(SHREW_ANIMATION_RULES);
const HOLE_DIRTY_MASK = bitsOf(HOLE_VIEW_RULES);
const HAMMER_DIRTY_MASK = bitsOf(HAMMER_VIEW_RULES);
const COMBO_DIRTY_MASK = bitsOf(COMBO_VIEW_RULES);
const SCENE_DIRTY_MASK = bitsOf(SCENE_VIEW_RULES);
const PLAYER_DIRTY_MASK = bitsOf(PLAYER_VIEW_RULES);
const HIT_DIRTY_MASK = bitsOf(HIT_VIEW_RULES);
const PERF_HERO_DIRTY_MASK = bitsOf(PERF_HERO_VIEW_RULES);

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
  private perfHeroBinding: BindingFn | null = null;

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
  /** 注册调试压测英雄 Spine 绑定 */
  registerPerfHeroBinding(fn: BindingFn): void { this.perfHeroBinding = fn; }

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
      if ((shrewDirty & SHREW_DIRTY_MASK) || forceFull) {
        this.shrewBinding?.(eid, shrewDirty, forceFull);
      }

      // Hole 绑定
      const holeDirty = DirtyComponent.holeDirty[eid];
      if ((holeDirty & HOLE_DIRTY_MASK) || forceFull) {
        this.holeBinding?.(eid, holeDirty, forceFull);
      }

      // Hammer 绑定
      const hammerDirty = DirtyComponent.hammerDirty[eid];
      if ((hammerDirty & HAMMER_DIRTY_MASK) || forceFull) {
        this.hammerBinding?.(eid, hammerDirty, forceFull);
      }

      // Combo 绑定
      const comboDirty = DirtyComponent.comboDirty[eid];
      if ((comboDirty & COMBO_DIRTY_MASK) || forceFull) {
        this.comboBinding?.(eid, comboDirty, forceFull);
      }

      // Scene 绑定
      const sceneDirty = DirtyComponent.sceneDirty[eid];
      if ((sceneDirty & SCENE_DIRTY_MASK) || forceFull) {
        this.sceneBinding?.(eid, sceneDirty, forceFull);
      }

      // Player 绑定
      const playerDirty = DirtyComponent.playerDirty[eid];
      if ((playerDirty & PLAYER_DIRTY_MASK) || forceFull) {
        this.playerBinding?.(eid, playerDirty, forceFull);
      }

      // Anim 绑定
      const animDirty = DirtyComponent.animDirty[eid];
      if ((animDirty & ANIM_DIRTY_MASK) || forceFull) {
        this.animBinding?.(eid, animDirty, forceFull);
      }

      // Hit 绑定
      const hitDirty = DirtyComponent.hitDirty[eid];
      if ((hitDirty & HIT_DIRTY_MASK) || forceFull) {
        this.hitBinding?.(eid, hitDirty, forceFull);
      }

      // 调试压测英雄 Spine 绑定
      const perfHeroDirty = DirtyComponent.perfHeroDirty[eid];
      if ((perfHeroDirty & PERF_HERO_DIRTY_MASK) || forceFull) {
        this.perfHeroBinding?.(eid, perfHeroDirty, forceFull);
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
      DirtyComponent.perfHeroDirty[eid] = 0;
      DirtyComponent.forceFullSync[eid] = 0;
    }
  }
}
