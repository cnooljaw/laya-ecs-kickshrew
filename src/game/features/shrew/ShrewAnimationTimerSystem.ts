/**
 * ShrewAnimationTimerSystem — 推进地鼠动画计时器
 *
 * 职责:
 * 1. 推进每个实体的 AnimationComponent.progress (progress += delta / duration)
 * 2. progress >= 1.0 时标记动画完成（由后续系统读取处理）
 * 3. duration=0 时跳过该实体（防止除零）
 */
import { defineQuery } from "bitecs";
import { AnimationComponent } from "./ShrewComponents";

const animationQuery = defineQuery([AnimationComponent]);

/**
 * 推进地鼠动画计时器
 * @param world ECS 世界
 * @param delta 帧间隔时间（秒）
 */
export function shrewAnimationTimerSystem(world: any, delta: number): void {
  // 推进动画 progress
  const animEntities = animationQuery(world);
  for (let i = 0; i < animEntities.length; i++) {
    const eid = animEntities[i];
    const duration = AnimationComponent.duration[eid];

    // duration=0 时跳过，防止除零
    if (duration <= 0) continue;

    AnimationComponent.progress[eid] += delta / duration;
  }
}
