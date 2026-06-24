import { HoleComponent } from "../../../ecs/components";
import {
  BIT_HOLE_POS,
  BIT_HOLE_SHREW,
  BIT_HOLE_ZORDER,
} from "../../DirtyFlags";
import type { IHoleNode } from "../../contracts/HoleViewContract";
import { createSyncRow, defineViewSyncSpec } from "../ViewSyncSpec";

type HoleField = Extract<keyof typeof HoleComponent, string>;
const syncRow = createSyncRow<IHoleNode, HoleField>();

function applyPosition({ eid, node }: { eid: number; node: IHoleNode }): void {
  node.setPosition(HoleComponent.posXRatio[eid], HoleComponent.posYRatio[eid]);
}

function applyShrewVisible({ eid, node }: { eid: number; node: IHoleNode }): void {
  node.setShrewVisible(HoleComponent.shrewEid[eid]);
}

function applyZOrder({ eid, node }: { eid: number; node: IHoleNode }): void {
  node.setZOrder(HoleComponent.zIndex[eid]);
}

export const HOLE_VIEW_SYNC_SPEC = defineViewSyncSpec<IHoleNode, HoleField>(
  "HoleComponent",
  HoleComponent,
  [
    // bit               label            fields                    apply
    syncRow(BIT_HOLE_POS,    "洞位坐标",      ["posXRatio", "posYRatio"], applyPosition),
    syncRow(BIT_HOLE_SHREW,  "洞位绑定地鼠",  ["shrewEid"],               applyShrewVisible),
    syncRow(BIT_HOLE_ZORDER, "洞位层级",      ["zIndex"],                 applyZOrder),
  ],
);
