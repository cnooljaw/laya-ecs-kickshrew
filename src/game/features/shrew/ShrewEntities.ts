import { defineEntity } from "../../../framework/ecs/EntityDefinition";
export { HoleEntity, SceneEntity, type HoleEntityInput } from "../../board/index";
import { AnimationComponent, BoardPositionComponent, ShrewComponent } from "./ShrewComponents";
import { MapType, type ShrewType } from "./ShrewTypes";
import { resetShrewForNextCycle } from "./ShrewLifecycle";

export interface ShrewEntityInput {
  shrewType: ShrewType;
  mapType: MapType;
  holeIndex?: number;
}

export const ShrewEntity = defineEntity<ShrewEntityInput>({
  name: "shrew",
  components: [ShrewComponent, AnimationComponent, BoardPositionComponent],
  cardinality: "many",
  initialize: (eid, input) => {
    ShrewComponent.shrewType[eid] = input.shrewType;
    ShrewComponent.holeIndex[eid] = input.holeIndex ?? -1;
    ShrewComponent.mapType[eid] = input.mapType;
    ShrewComponent.propType[eid] = 0;
    BoardPositionComponent.xRatio[eid] = 0;
    BoardPositionComponent.yRatio[eid] = 0;
    BoardPositionComponent.zIndex[eid] = 0;
    resetShrewForNextCycle(eid);
  },
});
