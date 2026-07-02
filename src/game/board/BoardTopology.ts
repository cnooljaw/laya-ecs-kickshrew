import { defineQuery } from "bitecs";
import { defineCapability } from "../../framework/feature/FeatureSetupContext";
import { HoleComponent, SceneComponent } from "./BoardComponents";

export interface BoardTopology {
  readonly scene: number;
  readonly holes: readonly number[];
}

export const BoardTopologyCapability = defineCapability<BoardTopology>("board.topology");

export function createBoardTopology(scene: number, holes: readonly number[]): BoardTopology {
  return {
    scene,
    holes: [...holes],
  };
}

const sceneQuery = defineQuery([SceneComponent]);
const holeQuery = defineQuery([HoleComponent]);

export function createBoardTopologyFromWorld(world: any): BoardTopology | undefined {
  const scenes = sceneQuery(world);
  if (scenes.length === 0) return undefined;

  const holes = Array.from(holeQuery(world));
  holes.sort((a, b) => HoleComponent.index[a] - HoleComponent.index[b]);
  if (holes.length === 0) return undefined;
  return createBoardTopology(scenes[0], holes);
}
