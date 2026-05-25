/**
 * HoleViewBinding — HoleComponent → HoleNode 绑定
 */
import { HoleComponent, DirtyComponent } from "../ecs/components";
import { BIT_HOLE_POS, BIT_HOLE_SHREW, BIT_HOLE_ZORDER } from "./DirtyFlags";
import type { BindingFn } from "./SyncView";

export interface IHoleNode {
  setPosition(xRatio: number, yRatio: number): void;
  setShrewVisible(shrewEid: number): void;
  setZOrder(z: number): void;
}

const holeNodeMap = new Map<number, IHoleNode>();

export function registerHoleNode(eid: number, node: IHoleNode): void { holeNodeMap.set(eid, node); }
export function unregisterHoleNode(eid: number): void { holeNodeMap.delete(eid); }

export const holeViewBinding: BindingFn = (eid: number, dirtyBits: number, forceFull: boolean) => {
  const node = holeNodeMap.get(eid);
  if (!node) return;

  if (forceFull || (dirtyBits & BIT_HOLE_POS)) {
    node.setPosition(HoleComponent.posXRatio[eid], HoleComponent.posYRatio[eid]);
  }
  if (forceFull || (dirtyBits & BIT_HOLE_SHREW)) {
    node.setShrewVisible(HoleComponent.shrewEid[eid]);
  }
  if (forceFull || (dirtyBits & BIT_HOLE_ZORDER)) {
    node.setZOrder(HoleComponent.zIndex[eid]);
  }
};
