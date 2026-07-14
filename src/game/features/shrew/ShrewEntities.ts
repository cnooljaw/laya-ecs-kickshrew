import { defineEntity } from "../../../framework/ecs/EntityDefinition";
import { BoardPositionComponent } from "../../board/index";
import { AnimationComponent, ShrewComponent } from "./ShrewComponents";
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
    ShrewComponent.serverControlled[eid] = 0;
    ShrewComponent.spawnSeq[eid] = 0;
    ShrewComponent.timelineRev[eid] = 0;
    ShrewComponent.serverOverrideAction[eid] = 0;
    ShrewComponent.serverOverrideStartMs[eid] = 0;
    ShrewComponent.serverOverrideEndMs[eid] = 0;
    BoardPositionComponent.xRatio[eid] = 0;
    BoardPositionComponent.yRatio[eid] = 0;
    BoardPositionComponent.zIndex[eid] = 0;
    resetShrewForNextCycle(eid);
  },
});
