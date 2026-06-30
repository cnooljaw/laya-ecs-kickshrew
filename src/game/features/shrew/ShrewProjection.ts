import { animTypeName, consoleHitTraceLogger } from "../../../debug/HitTraceLogger";
import {
  defineProjection,
  noProjection,
  projectionSource,
  watch,
} from "../../../framework/sync/ProjectionDefinition";
import {
  AnimationComponent,
  BoardPositionComponent,
  ShrewComponent,
} from "./ShrewComponents";
import { AnimType, ShrewAction } from "./ShrewTypes";
import type { IShrewNode } from "./IShrewNode";

const shrewSource = projectionSource("shrew", ShrewComponent);
const animationSource = projectionSource("animation", AnimationComponent);
const boardPositionSource = projectionSource("boardPosition", BoardPositionComponent);

function applyShrewSprite({ eid, node }: { eid: number; node: IShrewNode }): void {
  node.setSpriteFrame(ShrewComponent.shrewType[eid], ShrewComponent.mapType[eid]);
}

function applyShrewAnimation({ eid, node }: { eid: number; node: IShrewNode }): void {
  if (ShrewComponent.actionState[eid] === ShrewAction.Dizzy) {
    consoleHitTraceLogger.log("binding.dizzyAnimation", {
      eid,
      source: "shrewProjection",
      actionState: ShrewComponent.actionState[eid],
      animType: AnimationComponent.animType[eid],
      animTypeName: animTypeName(AnimationComponent.animType[eid]),
      progress: AnimationComponent.progress[eid],
      isDizzyAnim: AnimationComponent.animType[eid] === AnimType.Dizzy,
    });
  }
  node.setAnimation(
    ShrewComponent.actionState[eid],
    AnimationComponent.animType[eid],
    AnimationComponent.progress[eid],
  );
}

export const ShrewProjection = defineProjection<IShrewNode>({
  name: "shrew",
  components: [ShrewComponent, AnimationComponent, BoardPositionComponent],
  rows: [
    watch(boardPositionSource, ["xRatio", "yRatio"], "shrew board position", ({ eid, node }) => {
      node.setPosition(BoardPositionComponent.xRatio[eid], BoardPositionComponent.yRatio[eid]);
    }),
    watch(boardPositionSource, ["zIndex"], "shrew board z-order", ({ eid, node }) => {
      node.setZOrder(BoardPositionComponent.zIndex[eid]);
    }),
    watch(shrewSource, ["shrewType"], "shrew type", applyShrewSprite),
    watch(shrewSource, ["holeIndex"], "shrew hole index", noProjection),
    watch(shrewSource, ["hp"], "shrew hp", noProjection),
    watch(shrewSource, ["actionState"], "shrew action", applyShrewAnimation),
    watch(shrewSource, ["hasHat"], "shrew hat", ({ eid, node }) => {
      node.setHatVisible(ShrewComponent.hasHat[eid] === 1);
    }),
    watch(shrewSource, ["mapType"], "shrew map", applyShrewSprite),
    watch(shrewSource, ["isClickable"], "shrew clickable", ({ eid, node }) => {
      node.setClickable(ShrewComponent.isClickable[eid] === 1);
    }),
    watch(shrewSource, ["animTimer"], "shrew timer", noProjection),
    watch(shrewSource, ["propType"], "shrew prop", ({ eid, node }) => {
      node.setPropType(ShrewComponent.propType[eid]);
    }),
    watch(animationSource, ["animType"], "animation type", applyShrewAnimation),
    watch(animationSource, ["progress"], "animation progress", applyShrewAnimation),
    watch(animationSource, ["duration"], "animation duration", applyShrewAnimation),
  ],
});
