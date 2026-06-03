import { PerfLadybirdComponent } from "../ecs/components";
import { BIT_PERF_LADYBIRD_PHASE, BIT_PERF_LADYBIRD_POS, BIT_PERF_LADYBIRD_SCALE } from "./DirtyFlags";
import type { BindingFn } from "./SyncView";

export interface IPerfLadybirdNode {
  setTransform(x: number, y: number, scale: number, phase: number): void;
}

const perfLadybirdNodeMap = new Map<number, IPerfLadybirdNode>();

export function registerPerfLadybirdNode(eid: number, node: IPerfLadybirdNode): void {
  perfLadybirdNodeMap.set(eid, node);
}

export function unregisterPerfLadybirdNode(eid: number): void {
  perfLadybirdNodeMap.delete(eid);
}

export const perfLadybirdViewBinding: BindingFn = (eid: number, dirtyBits: number, forceFull: boolean) => {
  const node = perfLadybirdNodeMap.get(eid);
  if (!node) return;

  if (
    forceFull ||
    (dirtyBits & BIT_PERF_LADYBIRD_POS) ||
    (dirtyBits & BIT_PERF_LADYBIRD_PHASE) ||
    (dirtyBits & BIT_PERF_LADYBIRD_SCALE)
  ) {
    node.setTransform(
      PerfLadybirdComponent.posX[eid],
      PerfLadybirdComponent.posY[eid],
      PerfLadybirdComponent.scale[eid],
      PerfLadybirdComponent.phase[eid],
    );
  }
};
