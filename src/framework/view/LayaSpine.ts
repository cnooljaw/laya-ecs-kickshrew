import { getLaya } from "./LayaRuntime";

export function createSkeleton(template: any, armatureIndex = 0): any {
  if (template?.buildArmature) {
    return template.buildArmature(armatureIndex);
  }

  const Laya = getLaya();
  if (!Laya?.Skeleton) {
    throw new Error("Laya.Skeleton is unavailable");
  }
  const skeleton = new Laya.Skeleton();
  skeleton.templet = template;
  return skeleton;
}
