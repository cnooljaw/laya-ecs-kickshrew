/**
 * ShrewStateSystem — 地鼠状态机系统
 *
 * 状态循环: Wait → Up → Stand → Down → Wait
 * 特殊状态: Dizzy(被击中短暂停留) → Wait
 *
 * 状态转换规则:
 * - Wait → Up: animTimer 倒计时到 0，启动上移动画(0.31s)
 * - Up → Stand: 动画完成(progress>=1)，设为可点击，停留2秒
 * - Stand → Down: animTimer 倒计时到 0，启动下移动画(0.31s)
 * - Down → Wait: 动画完成后重置 hp/hasHat/isClickable，随机等待下一轮
 * - Dizzy → Wait: 被击中后短暂停留，直接重置到下一轮等待
 */
import { defineQuery } from "bitecs";
import { ShrewComponent, AnimationComponent } from "./ShrewComponents";
import { resetShrewForNextCycle } from "./ShrewLifecycle";
import { getShrewTiming } from "./ShrewRules";
import { ShrewAction, AnimType } from "./ShrewTypes";

const shrewQuery = defineQuery([ShrewComponent, AnimationComponent]);

/**
 * 地鼠状态机系统
 * 注意: animTimer 由本系统自行递减，不依赖 AnimationTimerSystem
 */
export function shrewStateSystem(world: any, deltaSec: number): void {
  const entities = shrewQuery(world);

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const state = ShrewComponent.actionState[eid] as ShrewAction;

    switch (state) {
      case ShrewAction.Wait:
        handleWait(eid, deltaSec);
        break;
      case ShrewAction.Up:
        handleUp(eid);
        break;
      case ShrewAction.Stand:
        handleStand(eid, deltaSec);
        break;
      case ShrewAction.Down:
        handleDown(eid);
        break;
      case ShrewAction.Dizzy:
        handleDizzy(eid, deltaSec);
        break;
    }
  }
}

function handleWait(eid: number, deltaSec: number): void {
  const timing = getShrewTiming();
  const timer = ShrewComponent.animTimer[eid];
  if (timer <= 0) {
    // Wait → Up
    ShrewComponent.actionState[eid] = ShrewAction.Up;
    AnimationComponent.animType[eid] = AnimType.Up;
    AnimationComponent.progress[eid] = 0;
    AnimationComponent.duration[eid] = timing.upDurationSec;
  } else {
    // 继续等待
    ShrewComponent.animTimer[eid] = timer - deltaSec;
  }
}

function handleUp(eid: number): void {
  const timing = getShrewTiming();
  if (AnimationComponent.progress[eid] >= 1.0) {
    // Up → Stand
    ShrewComponent.actionState[eid] = ShrewAction.Stand;
    ShrewComponent.isClickable[eid] = 1;
    ShrewComponent.animTimer[eid] = timing.standSec;
    AnimationComponent.animType[eid] = AnimType.Stand;
    AnimationComponent.progress[eid] = 0;
    AnimationComponent.duration[eid] = 0;
  }
}

function handleStand(eid: number, deltaSec: number): void {
  const timing = getShrewTiming();
  const timer = ShrewComponent.animTimer[eid];
  if (timer <= 0) {
    // Stand → Down
    ShrewComponent.actionState[eid] = ShrewAction.Down;
    ShrewComponent.isClickable[eid] = 0;
    AnimationComponent.animType[eid] = AnimType.Down;
    AnimationComponent.progress[eid] = 0;
    AnimationComponent.duration[eid] = timing.downDurationSec;
  } else {
    // 继续站立
    ShrewComponent.animTimer[eid] = timer - deltaSec;
  }
}

function handleDown(eid: number): void {
  if (AnimationComponent.progress[eid] >= 1.0) {
    // Down → Wait
    resetShrewForNextCycle(eid);
  }
}

function handleDizzy(eid: number, deltaSec: number): void {
  if (ShrewComponent.animTimer[eid] <= 0) {
    // Dizzy → Wait
    resetShrewForNextCycle(eid);
  } else {
    ShrewComponent.animTimer[eid] -= deltaSec;
  }
}
