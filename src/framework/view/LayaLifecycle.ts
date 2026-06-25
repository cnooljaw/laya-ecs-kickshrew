import { getLaya } from "./LayaRuntime";

export function destroyNode(node: any): void {
  node?.offAll?.();
  node?.destroy?.();
}

export function destroyChildren(owner: any): void {
  owner?.removeChildren?.(0, -1, true);
}

export function clearTweens(target: any): void {
  getLaya()?.Tween?.clearAll?.(target);
}
