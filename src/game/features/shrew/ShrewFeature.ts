import { defineFeature, defineSystem } from "../../../framework/feature/FeatureManifest";
import type { FeatureSetupContext } from "../../../framework/feature/FeatureSetupContext";
import { shrewAnimationTimerSystem } from "./ShrewAnimationTimerSystem";
import { BoardCapability, BoardOccupantKind } from "../board/index";
import { ShrewEntity } from "./ShrewEntities";
import { shrewBoardSyncSystem, syncShrewBoardPosition } from "./ShrewBoardSyncSystem";
import { ShrewProjection } from "./ShrewProjection";
import { ShrewNode } from "./ShrewNode";
import { shrewStateSystem } from "./ShrewStateSystem";
import { MapType, ShrewType } from "./ShrewTypes";

export interface CoreGameplaySetupResult {
  shrews: number[];
}

export function setupCoreGameplay({
  entities,
  mountOne,
  use,
}: FeatureSetupContext): CoreGameplaySetupResult {
  const board = use(BoardCapability);
  const shrews: number[] = [];
  for (let index = 0; index < board.holes.length; index++) {
    const shrewEid = entities.create(ShrewEntity, {
      shrewType: randomShrewType(),
      mapType: MapType.Meadow,
      holeIndex: index,
    });
    board.bindResident(index, BoardOccupantKind.Shrew, shrewEid);
    syncShrewBoardPosition(shrewEid, board.getHoleEid(index));
    shrews.push(shrewEid);

    mountOne({
      eid: shrewEid,
      projection: ShrewProjection,
      create: () => new ShrewNode(),
    });
  }

  return { shrews };
}

export const ShrewFeature = defineFeature({
  name: "shrew",
  entities: [ShrewEntity],
  projections: [ShrewProjection],
  systems: [
    defineSystem("state", "shrew.animationTimer", shrewAnimationTimerSystem),
    defineSystem("state", "shrew.state", shrewStateSystem),
    defineSystem("feature", "shrew.boardSync", shrewBoardSyncSystem),
  ],
  setup: setupCoreGameplay,
});

function randomShrewType(): ShrewType {
  const types = [ShrewType.Red, ShrewType.Blue, ShrewType.Yellow, ShrewType.Green];
  return types[Math.floor(Math.random() * types.length)];
}
