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
import { DIRTY_TARGETS, type DirtyTarget } from "../sync/DirtyTargets";
import { bitsOf } from "../sync/rules/ViewBindingRule";
import type { ViewBindingRule } from "../sync/rules/ViewBindingRule";

const dirtyQuery = defineQuery([DirtyComponent]);

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
      throw new Error(`SyncChannel name 重复: ${channel.name}`);
    }
    this.channels.push(channel);
  }

  registerChannels(channels: readonly SyncChannel[]): void {
    for (const channel of channels) {
      this.registerChannel(channel);
    }
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
