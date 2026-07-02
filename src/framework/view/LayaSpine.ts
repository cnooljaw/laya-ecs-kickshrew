import { getLaya } from "./LayaRuntime";

export function createSkeleton(template: any, aniMode = 0): any {
  if (template?.buildArmature) {
    return template.buildArmature(aniMode);
  }

  const Laya = getLaya();
  if (!Laya?.Skeleton) {
    throw new Error("Laya.Skeleton is unavailable");
  }
  const skeleton = new Laya.Skeleton(aniMode);
  skeleton.templet = template;
  return skeleton;
}
