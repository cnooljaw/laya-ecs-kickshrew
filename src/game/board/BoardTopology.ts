import { defineCapability } from "../../framework/feature/FeatureSetupContext";

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
