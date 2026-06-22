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
import type { ViewBindingRule } from "../sync/rules/ViewBindingRule";
import type { DirtyTarget } from "../ecs/dirty/DirtySchemaTypes";
import { SHREW_ANIMATION_RULES, SHREW_COMPONENT_RULES } from "../sync/rules/ShrewViewRules";
import { HOLE_VIEW_RULES } from "../sync/rules/HoleViewRules";
import { HAMMER_VIEW_RULES } from "../sync/rules/HammerViewRules";
import { COMBO_VIEW_RULES } from "../sync/rules/ComboViewRules";
import { SCENE_VIEW_RULES } from "../sync/rules/SceneViewRules";
import { PLAYER_VIEW_RULES } from "../sync/rules/PlayerViewRules";
import { HIT_VIEW_RULES } from "../sync/rules/HitViewRules";
import { PERF_HERO_VIEW_RULES } from "../sync/rules/PerfHeroViewRules";

const dirtyQuery = defineQuery([DirtyComponent]);
const DIRTY_TARGETS: DirtyTarget[] = [
  "shrewDirty",
  "holeDirty",
  "hammerDirty",
  "comboDirty",
  "sceneDirty",
  "playerDirty",
  "animDirty",
  "hitDirty",
  "perfHeroDirty",
  "monsterDirty",
];

/** 视图绑定函数类型 */
export type BindingFn = (eid: number, dirtyBits: number, forceFull: boolean) => void;

export interface SyncChannel {
  name: string;
  dirtyTarget: DirtyTarget;
  mask: number;
  binding: BindingFn;
}

export function createRuleSyncChannel<TNode>(options: {
  name: string;
  dirtyTarget: DirtyTarget;
  rules: readonly ViewBindingRule<TNode>[];
  binding: BindingFn;
}): SyncChannel {
  return {
    name: options.name,
    dirtyTarget: options.dirtyTarget,
    mask: bitsOf(options.rules),
    binding: options.binding,
  };
}

/**
 * SyncView 同步器
 * 管理所有 Binding 函数，按帧执行同步
 */
export class SyncView {
  private readonly channels: SyncChannel[] = [];

  registerChannel(channel: SyncChannel): void {
    const existingIndex = this.channels.findIndex(item => item.name === channel.name);
    if (existingIndex >= 0) {
      this.channels[existingIndex] = channel;
      return;
    }
    this.channels.push(channel);
  }

  registerChannels(channels: readonly SyncChannel[]): void {
    for (const channel of channels) {
      this.registerChannel(channel);
    }
  }

  /** 注册地鼠绑定 */
  registerShrewBinding(fn: BindingFn): void {
    this.registerChannel(createRuleSyncChannel({
      name: "shrew",
      dirtyTarget: "shrewDirty",
      rules: SHREW_COMPONENT_RULES,
      binding: fn,
    }));
  }
  /** 注册洞位绑定 */
  registerHoleBinding(fn: BindingFn): void {
    this.registerChannel(createRuleSyncChannel({
      name: "hole",
      dirtyTarget: "holeDirty",
      rules: HOLE_VIEW_RULES,
      binding: fn,
    }));
  }
  /** 注册锤子绑定 */
  registerHammerBinding(fn: BindingFn): void {
    this.registerChannel(createRuleSyncChannel({
      name: "hammer",
      dirtyTarget: "hammerDirty",
      rules: HAMMER_VIEW_RULES,
      binding: fn,
    }));
  }
  /** 注册连击绑定 */
  registerComboBinding(fn: BindingFn): void {
    this.registerChannel(createRuleSyncChannel({
      name: "combo",
      dirtyTarget: "comboDirty",
      rules: COMBO_VIEW_RULES,
      binding: fn,
    }));
  }
  /** 注册场景绑定 */
  registerSceneBinding(fn: BindingFn): void {
    this.registerChannel(createRuleSyncChannel({
      name: "scene",
      dirtyTarget: "sceneDirty",
      rules: SCENE_VIEW_RULES,
      binding: fn,
    }));
  }
  /** 注册玩家绑定 */
  registerPlayerBinding(fn: BindingFn): void {
    this.registerChannel(createRuleSyncChannel({
      name: "player",
      dirtyTarget: "playerDirty",
      rules: PLAYER_VIEW_RULES,
      binding: fn,
    }));
  }
  /** 注册动画绑定 */
  registerAnimBinding(fn: BindingFn): void {
    this.registerChannel(createRuleSyncChannel({
      name: "anim",
      dirtyTarget: "animDirty",
      rules: SHREW_ANIMATION_RULES,
      binding: fn,
    }));
  }
  /** 注册击中绑定 */
  registerHitBinding(fn: BindingFn): void {
    this.registerChannel(createRuleSyncChannel({
      name: "hit",
      dirtyTarget: "hitDirty",
      rules: HIT_VIEW_RULES,
      binding: fn,
    }));
  }
  /** 注册调试压测英雄 Spine 绑定 */
  registerPerfHeroBinding(fn: BindingFn): void {
    this.registerChannel(createRuleSyncChannel({
      name: "perfHero",
      dirtyTarget: "perfHeroDirty",
      rules: PERF_HERO_VIEW_RULES,
      binding: fn,
    }));
  }

  /**
   * 执行同步: 遍历所有脏实体，调用对应 Binding，然后清除标记
   */
  sync(world: any): void {
    const entities = dirtyQuery(world);

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      const forceFull = DirtyComponent.forceFullSync[eid] === 1;

      for (const channel of this.channels) {
        const dirtyBits = DirtyComponent[channel.dirtyTarget][eid];
        if ((dirtyBits & channel.mask) || forceFull) {
          channel.binding(eid, dirtyBits, forceFull);
        }
      }

      // 清除 dirty bits (forceFullSync 也清除)
      for (const target of DIRTY_TARGETS) {
        DirtyComponent[target][eid] = 0;
      }
      DirtyComponent.forceFullSync[eid] = 0;
    }
  }
}
