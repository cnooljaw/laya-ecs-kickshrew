import { HoleComponent } from "../ecs/components";
import { animationTimerSystem } from "../ecs/gameplay/core/AnimationTimerSystem";
import { HoleEntity, SceneEntity, ShrewEntity } from "../ecs/gameplay/core/CoreEntities";
import { sceneCycleSystem } from "../ecs/gameplay/core/SceneCycleSystem";
import { shrewStateSystem } from "../ecs/gameplay/core/ShrewStateSystem";
import { HOLE_COUNT, MapType, ShrewType } from "../ecs/types";
import {
  HoleProjection,
  SceneProjection,
  ShrewProjection,
} from "../sync/projections/CoreProjections";
import { HoleNode } from "../view/HoleNode";
import { SceneLayer } from "../view/SceneLayer";
import { ShrewNode } from "../view/ShrewNode";
import type { FeatureRuntimeContext } from "../framework/feature/FeatureRuntimeContext";
import { defineFeature, defineSystem } from "../framework/feature/FeatureManifest";

export interface CoreGameplaySetupResult {
  scene: number;
  holes: number[];
  shrews: number[];
}

export function setupCoreGameplay({
  entities,
  mountOne,
}: FeatureRuntimeContext): CoreGameplaySetupResult {
  const scene = entities.one(SceneEntity);
  mountOne({
    eid: scene,
    projection: SceneProjection,
    create: () => new SceneLayer(),
  });

  const holes: number[] = [];
  const shrews: number[] = [];
  for (let index = 0; index < HOLE_COUNT; index++) {
    const holeEid = entities.create(HoleEntity, {
      index,
      mapType: MapType.Meadow,
    });
    const shrewEid = entities.create(ShrewEntity, {
      shrewType: randomShrewType(),
      mapType: MapType.Meadow,
    });
    HoleComponent.shrewEid[holeEid] = shrewEid;
    holes.push(holeEid);
    shrews.push(shrewEid);

    const holeNode = mountOne({
      eid: holeEid,
      projection: HoleProjection,
      create: () => new HoleNode(),
    });
    mountOne({
      eid: shrewEid,
      projection: ShrewProjection,
      parent: holeNode.getContainer(),
      create: () => new ShrewNode(),
    });
  }

  return { scene, holes, shrews };
}

export const CoreGameplayFeature = defineFeature({
  name: "coreGameplay",
  entities: [SceneEntity, HoleEntity, ShrewEntity],
  projections: [SceneProjection, HoleProjection, ShrewProjection],
  systems: [
    defineSystem("state", "shrew.animationTimer", animationTimerSystem),
    defineSystem("state", "shrew.state", shrewStateSystem),
    defineSystem("state", "shrew.sceneCycle", sceneCycleSystem),
  ],
  setup: setupCoreGameplay,
});

function randomShrewType(): ShrewType {
  const types = [ShrewType.Red, ShrewType.Blue, ShrewType.Yellow, ShrewType.Green];
  return types[Math.floor(Math.random() * types.length)];
}
