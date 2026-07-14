import { defineEntity } from "../../framework/ecs/EntityDefinition";
import { SCENE_CYCLE_INTERVAL } from "./SceneConfig";
import { HolePositions, getHoleGrid, getHoleZOrder } from "./HolePositions";
import { BoardOccupantKind, MapType } from "./BoardTypes";
import { HoleComponent, SceneComponent } from "./BoardComponents";

export interface HoleEntityInput {
  index: number;
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
    SceneComponent.serverControlled[eid] = 0;
    SceneComponent.mapRevision[eid] = 0;
    SceneComponent.mapStartedMs[eid] = 0;
    SceneComponent.nextSwitchMs[eid] = 0;
    SceneComponent.nextMap[eid] = MapType.None;
    SceneComponent.cycleMs[eid] = SCENE_CYCLE_INTERVAL * 1000;
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
    HoleComponent.index[eid] = input.index;
    HoleComponent.gridRow[eid] = row;
    HoleComponent.gridCol[eid] = col;
    HoleComponent.posXRatio[eid] = positions.xRatios[input.index];
    HoleComponent.posYRatio[eid] = positions.yRatios[input.index];
    HoleComponent.residentKind[eid] = BoardOccupantKind.Empty;
    HoleComponent.residentEid[eid] = 0;
    HoleComponent.occupantKind[eid] = BoardOccupantKind.Empty;
    HoleComponent.occupantEid[eid] = 0;
    HoleComponent.zIndex[eid] = getHoleZOrder(row);
  },
});
