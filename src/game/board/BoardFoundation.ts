import { defineFeature, defineSystem } from "../../framework/feature/FeatureManifest";
import type { FeatureSetupContext } from "../../framework/feature/FeatureSetupContext";
import { createBoardTopology, BoardTopologyCapability, type BoardTopology } from "./BoardTopology";
import { HoleEntity, SceneEntity } from "./BoardEntities";
import { HoleNode } from "./HoleNode";
import { HoleProjection, SceneProjection } from "./BoardProjection";
import { mapCycleSystem } from "./MapCycleSystem";
import { SceneLayer } from "./SceneLayer";
import { HOLE_COUNT, MapType } from "./BoardTypes";

export interface BoardSetupResult {
  scene: number;
  holes: number[];
  topology: BoardTopology;
}

export function setupBoard({
  entities,
  mountOne,
  provide,
}: FeatureSetupContext): BoardSetupResult {
  const scene = entities.one(SceneEntity);
  mountOne({
    eid: scene,
    projection: SceneProjection,
    create: () => new SceneLayer(),
  });

  const holes: number[] = [];
  for (let index = 0; index < HOLE_COUNT; index++) {
    const holeEid = entities.create(HoleEntity, {
      index,
      mapType: MapType.Meadow,
    });
    holes.push(holeEid);
    mountOne({
      eid: holeEid,
      projection: HoleProjection,
      create: () => new HoleNode(),
    });
  }

  const topology = createBoardTopology(scene, holes);
  provide(BoardTopologyCapability, topology);
  return { scene, holes, topology };
}

export const BoardFoundation = defineFeature({
  name: "board",
  entities: [SceneEntity, HoleEntity],
  projections: [SceneProjection, HoleProjection],
  systems: [
    defineSystem("state", "board.mapCycle", mapCycleSystem),
  ],
  setup: setupBoard,
});
