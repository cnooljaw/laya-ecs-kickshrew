/**
 * ShrewStateSystem — 地鼠状态机系统
 *
 * 状态循环: None → Wait → Up → Stand → Down → Refresh → None
 * 特殊状态: Dizzy(被击中) → Delay → Down
 *
 * 状态转换规则:
 * - None → Wait: 随机等待 1~8 秒
 * - Wait → Up: animTimer 倒计时到 0，启动上移动画(0.31s)
 * - Up → Stand: 动画完成(progress>=1)，设为可点击，停留2秒
 * - Stand → Down: animTimer 倒计时到 0，启动下移动画(0.31s)
 * - Down → Refresh: 动画完成(progress>=1)
 * - Refresh → None: 重置地鼠属性(hp/hasHat/isClickable)，随机新类型
 * - Dizzy → Delay: 眩晕动画完成
 * - Delay → Down: 短暂停留后下移
 */
import { defineQuery } from "bitecs";
import { ShrewComponent, AnimationComponent } from "../components";
import { ShrewAction, ShrewType, AnimType } from "../types";

const shrewQuery = defineQuery([ShrewComponent, AnimationComponent]);

/** 上移动画时长(秒) */
const UP_DURATION = 0.31;
/** 下移动画时长(秒) */
const DOWN_DURATION = 0.31;
/** 站立停留时间(秒) */
const STAND_TIME = 2.0;
/** 等待时间范围 */
const WAIT_MIN = 1.0;
const WAIT_MAX = 8.0;

/** 每帧固定 delta (秒), 60fps */
const FRAME_DELTA = 1 / 60;

/**
 * 地鼠状态机系统
 * 注意: animTimer 由本系统自行递减，不依赖 AnimationTimerSystem
 */
export function shrewStateSystem(world: any): void {
  const entities = shrewQuery(world);

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const state = ShrewComponent.actionState[eid] as ShrewAction;

    switch (state) {
      case ShrewAction.None:
        handleNone(eid);
        break;
      case ShrewAction.Wait:
        handleWait(eid);
        break;
      case ShrewAction.Up:
        handleUp(eid);
        break;
      case ShrewAction.Stand:
        handleStand(eid);
        break;
      case ShrewAction.Down:
        handleDown(eid);
        break;
      case ShrewAction.Refresh:
        handleRefresh(eid);
        break;
      case ShrewAction.Dizzy:
        handleDizzy(eid);
        break;
      case ShrewAction.Delay:
        handleDelay(eid);
        break;
    }
  }
}

function handleNone(eid: number): void {
  // None → Wait: 随机等待时间
  ShrewComponent.actionState[eid] = ShrewAction.Wait;
  ShrewComponent.animTimer[eid] = randomRange(WAIT_MIN, WAIT_MAX);
  AnimationComponent.animType[eid] = AnimType.Idle;
  AnimationComponent.progress[eid] = 0;
  AnimationComponent.duration[eid] = 0;
}

function handleWait(eid: number): void {
  const timer = ShrewComponent.animTimer[eid];
  if (timer <= 0) {
    // Wait → Up
    ShrewComponent.actionState[eid] = ShrewAction.Up;
    AnimationComponent.animType[eid] = AnimType.Up;
    AnimationComponent.progress[eid] = 0;
    AnimationComponent.duration[eid] = UP_DURATION;
  } else {
    // 继续等待
    ShrewComponent.animTimer[eid] = timer - FRAME_DELTA;
  }
}

function handleUp(eid: number): void {
  if (AnimationComponent.progress[eid] >= 1.0) {
    // Up → Stand
    ShrewComponent.actionState[eid] = ShrewAction.Stand;
    ShrewComponent.isClickable[eid] = 1;
    ShrewComponent.animTimer[eid] = STAND_TIME;
    AnimationComponent.animType[eid] = AnimType.Stand;
    AnimationComponent.progress[eid] = 0;
    AnimationComponent.duration[eid] = 0;
  }
}

function handleStand(eid: number): void {
  const timer = ShrewComponent.animTimer[eid];
  if (timer <= 0) {
    // Stand → Down
    ShrewComponent.actionState[eid] = ShrewAction.Down;
    ShrewComponent.isClickable[eid] = 0;
    AnimationComponent.animType[eid] = AnimType.Down;
    AnimationComponent.progress[eid] = 0;
    AnimationComponent.duration[eid] = DOWN_DURATION;
  } else {
    // 继续站立
    ShrewComponent.animTimer[eid] = timer - FRAME_DELTA;
  }
}

function handleDown(eid: number): void {
  if (AnimationComponent.progress[eid] >= 1.0) {
    // Down → Refresh
    ShrewComponent.actionState[eid] = ShrewAction.Refresh;
  }
}

function handleRefresh(eid: number): void {
  // Refresh → None: 重置地鼠属性
  const shrewType = ShrewComponent.shrewType[eid] as ShrewType;
  ShrewComponent.hp[eid] = shrewType === ShrewType.Blue ? 2 : 1;
  ShrewComponent.hasHat[eid] = shrewType === ShrewType.Blue ? 1 : 0;
  ShrewComponent.actionState[eid] = ShrewAction.None;
  ShrewComponent.isClickable[eid] = 0;
  ShrewComponent.animTimer[eid] = 0;
  AnimationComponent.animType[eid] = AnimType.Idle;
  AnimationComponent.progress[eid] = 0;
  AnimationComponent.duration[eid] = 0;
}

function handleDizzy(eid: number): void {
  // Dizzy 动画完成后进入 Delay
  if (AnimationComponent.progress[eid] >= 1.0 || ShrewComponent.animTimer[eid] <= 0) {
    ShrewComponent.actionState[eid] = ShrewAction.Delay;
    ShrewComponent.animTimer[eid] = 0.3; // 短暂停留
    AnimationComponent.animType[eid] = AnimType.Dizzy;
    AnimationComponent.progress[eid] = 0;
    AnimationComponent.duration[eid] = 0;
  } else {
    ShrewComponent.animTimer[eid] -= FRAME_DELTA;
  }
}

function handleDelay(eid: number): void {
  if (ShrewComponent.animTimer[eid] <= 0) {
    // Delay → Down
    ShrewComponent.actionState[eid] = ShrewAction.Down;
    AnimationComponent.animType[eid] = AnimType.Down;
    AnimationComponent.progress[eid] = 0;
    AnimationComponent.duration[eid] = DOWN_DURATION;
  } else {
    ShrewComponent.animTimer[eid] -= FRAME_DELTA;
  }
}

/** 随机范围 [min, max] */
function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
