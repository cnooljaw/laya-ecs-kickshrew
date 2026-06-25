import {
  AnimationComponent,
  HoleComponent,
  SceneComponent,
  ShrewComponent,
} from "../../ecs/components";
import { AnimType, ShrewAction } from "../../ecs/types";
import { animTypeName, consoleHitTraceLogger } from "../../debug/HitTraceLogger";
import type { IHoleNode } from "../contracts/HoleViewContract";
import type { ISceneLayer } from "../contracts/SceneViewContract";
import type { IShrewNode } from "../contracts/ShrewViewContract";
import {
  defineProjection,
  noProjection,
  projectionSource,
  watch,
} from "../../framework/sync/ProjectionDefinition";

const sceneSource = projectionSource("scene", SceneComponent);
const holeSource = projectionSource("hole", HoleComponent);
const shrewSource = projectionSource("shrew", ShrewComponent);
const animationSource = projectionSource("animation", AnimationComponent);

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

export const SceneProjection = defineProjection<ISceneLayer>({
  name: "scene",
  components: [SceneComponent],
  rows: [
    watch(sceneSource, ["currentMap"], "current map", ({ eid, node }) => {
      node.switchScene(SceneComponent.currentMap[eid]);
    }),
    watch(sceneSource, ["sceneTimer"], "scene timer", noProjection),
    watch(sceneSource, ["transitioning"], "scene transition", ({ eid, node }) => {
      node.setTransitioning(SceneComponent.transitioning[eid] === 1);
    }),
  ],
});

export const HoleProjection = defineProjection<IHoleNode>({
  name: "hole",
  components: [HoleComponent],
  rows: [
    watch(holeSource, ["posXRatio", "posYRatio"], "hole position", ({ eid, node }) => {
      node.setPosition(HoleComponent.posXRatio[eid], HoleComponent.posYRatio[eid]);
    }),
    watch(holeSource, ["shrewEid"], "hole occupant", ({ eid, node }) => {
      node.setShrewVisible(HoleComponent.shrewEid[eid]);
    }),
    watch(holeSource, ["zIndex"], "hole z-order", ({ eid, node }) => {
      node.setZOrder(HoleComponent.zIndex[eid]);
    }),
  ],
});

export const ShrewProjection = defineProjection<IShrewNode>({
  name: "shrew",
  components: [ShrewComponent, AnimationComponent],
  rows: [
    watch(shrewSource, ["shrewType"], "shrew type", applyShrewSprite),
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
