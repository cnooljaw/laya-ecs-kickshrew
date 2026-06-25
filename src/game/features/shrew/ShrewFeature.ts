import { defineFeature, defineSystem } from "../../../framework/feature/FeatureManifest";
import type { FeatureRuntimeContext } from "../../../framework/feature/FeatureRuntimeContext";
import { animationTimerSystem } from "./AnimationTimerSystem";
import { HoleComponent } from "./ShrewComponents";
import { HoleEntity, SceneEntity, ShrewEntity } from "./ShrewEntities";
import { HoleNode } from "./HoleNode";
import { SceneLayer } from "./SceneLayer";
import { sceneCycleSystem } from "./SceneCycleSystem";
import {
  HoleProjection,
  SceneProjection,
  ShrewProjection,
} from "./ShrewProjection";
import { ShrewNode } from "./ShrewNode";
import { shrewStateSystem } from "./ShrewStateSystem";
import { HOLE_COUNT, MapType, ShrewType } from "./ShrewTypes";

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

export const ShrewFeature = defineFeature({
  name: "shrew",
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
