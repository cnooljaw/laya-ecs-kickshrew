import {
  defineProjection,
  noProjection,
  projectionSource,
  watch,
} from "../../framework/sync/ProjectionDefinition";
import { HoleComponent, SceneComponent } from "./BoardComponents";
import type { IHoleNode } from "./IHoleNode";
import type { ISceneLayer } from "./ISceneLayer";

const sceneSource = projectionSource("scene", SceneComponent);
const holeSource = projectionSource("hole", HoleComponent);

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
    watch(holeSource, ["occupantKind", "occupantEid"], "hole occupant", ({ eid, node }) => {
      node.setOccupant(HoleComponent.occupantKind[eid], HoleComponent.occupantEid[eid]);
    }),
    watch(holeSource, ["zIndex"], "hole z-order", ({ eid, node }) => {
      node.setZOrder(HoleComponent.zIndex[eid]);
    }),
  ],
});
