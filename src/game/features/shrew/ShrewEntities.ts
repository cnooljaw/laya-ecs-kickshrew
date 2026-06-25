import { defineEntity } from "../../../framework/ecs/EntityDefinition";
import { HolePositions, getHoleGrid, getHoleZOrder } from "./HolePositions";
import { SCENE_CYCLE_INTERVAL } from "./SceneConfig";
import { AnimationComponent, HoleComponent, SceneComponent, ShrewComponent } from "./ShrewComponents";
import { MapType, type ShrewType } from "./ShrewTypes";
import { resetShrewForNextCycle } from "./ShrewLifecycle";

export interface HoleEntityInput {
  index: number;
  mapType: MapType;
}

export interface ShrewEntityInput {
  shrewType: ShrewType;
  mapType: MapType;
}

export const SceneEntity = defineEntity({
  name: "scene",
  components: [SceneComponent],
  cardinality: "one",
  initialize: (eid: number) => {
    SceneComponent.currentMap[eid] = MapType.Meadow;
    SceneComponent.sceneTimer[eid] = 0;
    SceneComponent.cycleInterval[eid] = SCENE_CYCLE_INTERVAL;
    SceneComponent.transitioning[eid] = 0;
  },
});

export const HoleEntity = defineEntity<HoleEntityInput>({
  name: "hole",
  components: [HoleComponent],
  cardinality: "many",
  initialize: (eid, input) => {
    const positions = HolePositions[input.mapType];
    if (!positions) {
      throw new Error(`No hole positions for map type ${input.mapType}`);
    }
    if (input.index < 0 || input.index >= positions.xRatios.length) {
      throw new Error(`Invalid hole index ${input.index}`);
    }

    const { row, col } = getHoleGrid(input.index);
    HoleComponent.gridRow[eid] = row;
    HoleComponent.gridCol[eid] = col;
    HoleComponent.posXRatio[eid] = positions.xRatios[input.index];
    HoleComponent.posYRatio[eid] = positions.yRatios[input.index];
    HoleComponent.shrewEid[eid] = 0;
    HoleComponent.zIndex[eid] = getHoleZOrder(row);
  },
});

export const ShrewEntity = defineEntity<ShrewEntityInput>({
  name: "shrew",
  components: [ShrewComponent, AnimationComponent],
  cardinality: "many",
  initialize: (eid, input) => {
    ShrewComponent.shrewType[eid] = input.shrewType;
    ShrewComponent.mapType[eid] = input.mapType;
    ShrewComponent.propType[eid] = 0;
    resetShrewForNextCycle(eid);
  },
});
