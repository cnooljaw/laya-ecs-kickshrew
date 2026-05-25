/**
 * DirtyMarkSystem — 脏标记系统
 *
 * 职责: 比较当前帧与上一帧的组件数据差异，设置 DirtyComponent 的 bitmask。
 * SyncView 读取这些 bitmask 来决定哪些 Laya 节点属性需要更新。
 *
 * DirtyComponent.shrewDirty 的 bit 定义:
 *   BIT_SHREW_TYPE      = 0x0001
 *   BIT_SHREW_HP        = 0x0002
 *   BIT_SHREW_ACTION    = 0x0004
 *   BIT_SHREW_HAT       = 0x0008
 *   BIT_SHREW_MAP       = 0x0010
 *   BIT_SHREW_CLICKABLE = 0x0020
 *   BIT_SHREW_TIMER     = 0x0040
 *   BIT_SHREW_PROP      = 0x0080
 *
 * DirtyComponent.animDirty 的 bit 定义:
 *   BIT_ANIM_TYPE       = 0x0001
 *   BIT_ANIM_PROGRESS   = 0x0002
 *   BIT_ANIM_DURATION   = 0x0004
 */
import { defineQuery } from "bitecs";
import { ShrewComponent, AnimationComponent, DirtyComponent } from "../components";

const shrewQuery = defineQuery([ShrewComponent, AnimationComponent, DirtyComponent]);

/** shrewDirty bitmask 常量 */
export const BIT_SHREW_TYPE = 0x0001;
export const BIT_SHREW_HP = 0x0002;
export const BIT_SHREW_ACTION = 0x0004;
export const BIT_SHREW_HAT = 0x0008;
export const BIT_SHREW_MAP = 0x0010;
export const BIT_SHREW_CLICKABLE = 0x0020;
export const BIT_SHREW_TIMER = 0x0040;
export const BIT_SHREW_PROP = 0x0080;

/** animDirty bitmask 常量 */
export const BIT_ANIM_TYPE = 0x0001;
export const BIT_ANIM_PROGRESS = 0x0002;
export const BIT_ANIM_DURATION = 0x0004;

/** 上一帧快照，用于比较 */
const prevShrew = new Map<number, {
  shrewType: number; hp: number; actionState: number; hasHat: number;
  mapType: number; isClickable: number; animTimer: number; propType: number;
}>();
const prevAnim = new Map<number, {
  animType: number; progress: number; duration: number;
}>();

/**
 * 脏标记系统: 比较前后帧差异，设置 dirty bits
 */
export function dirtyMarkSystem(world: any): void {
  const entities = shrewQuery(world);

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];

    // 读取当前值
    const curShrew = {
      shrewType: ShrewComponent.shrewType[eid],
      hp: ShrewComponent.hp[eid],
      actionState: ShrewComponent.actionState[eid],
      hasHat: ShrewComponent.hasHat[eid],
      mapType: ShrewComponent.mapType[eid],
      isClickable: ShrewComponent.isClickable[eid],
      animTimer: ShrewComponent.animTimer[eid],
      propType: ShrewComponent.propType[eid],
    };
    const curAnim = {
      animType: AnimationComponent.animType[eid],
      progress: AnimationComponent.progress[eid],
      duration: AnimationComponent.duration[eid],
    };

    // 与上一帧比较
    const prev = prevShrew.get(eid);
    const prevA = prevAnim.get(eid);

    let shrewDirty = 0;
    let animDirty = 0;

    if (prev) {
      if (curShrew.shrewType !== prev.shrewType) shrewDirty |= BIT_SHREW_TYPE;
      if (curShrew.hp !== prev.hp) shrewDirty |= BIT_SHREW_HP;
      if (curShrew.actionState !== prev.actionState) shrewDirty |= BIT_SHREW_ACTION;
      if (curShrew.hasHat !== prev.hasHat) shrewDirty |= BIT_SHREW_HAT;
      if (curShrew.mapType !== prev.mapType) shrewDirty |= BIT_SHREW_MAP;
      if (curShrew.isClickable !== prev.isClickable) shrewDirty |= BIT_SHREW_CLICKABLE;
      if (curShrew.animTimer !== prev.animTimer) shrewDirty |= BIT_SHREW_TIMER;
      if (curShrew.propType !== prev.propType) shrewDirty |= BIT_SHREW_PROP;
    } else {
      // 首次：所有 bit 标脏
      shrewDirty = 0xFFFF;
    }

    if (prevA) {
      if (curAnim.animType !== prevA.animType) animDirty |= BIT_ANIM_TYPE;
      if (curAnim.progress !== prevA.progress) animDirty |= BIT_ANIM_PROGRESS;
      if (curAnim.duration !== prevA.duration) animDirty |= BIT_ANIM_DURATION;
    } else {
      animDirty = 0xFFFF;
    }

    // 保存当前值作为下一帧的"上一帧"
    prevShrew.set(eid, curShrew);
    prevAnim.set(eid, curAnim);

    // 写入 DirtyComponent (不清除已有的 bits，叠加)
    DirtyComponent.shrewDirty[eid] = shrewDirty;
    DirtyComponent.animDirty[eid] = animDirty;
  }
}
