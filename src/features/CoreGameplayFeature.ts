import {
  HoleViewSync,
  SceneViewSync,
  ShrewAnimationViewSync,
  ShrewViewSync,
} from "../binding/viewSyncs";
import { HoleComponent } from "../ecs/components";
import { animationTimerSystem } from "../ecs/gameplay/core/AnimationTimerSystem";
import { sceneCycleSystem } from "../ecs/gameplay/core/SceneCycleSystem";
import { shrewStateSystem } from "../ecs/gameplay/core/ShrewStateSystem";
import { createHoleEntities, createShrewEntity } from "../ecs/world";
import { HOLE_COUNT, MapType, ShrewType } from "../ecs/types";
import { HoleNode } from "../view/HoleNode";
import { SceneLayer } from "../view/SceneLayer";
import { ShrewNode } from "../view/ShrewNode";
import { system, type GameFeature } from "./GameFeature";

export const CoreGameplayFeature: GameFeature = {
  name: "coreGameplay",
  systems: [
    system("state", "animationTimerSystem", animationTimerSystem),
    system("state", "shrewStateSystem", shrewStateSystem),
    system("state", "sceneCycleSystem", (world) => sceneCycleSystem(world)),
  ],
  viewSyncs: [
    ShrewViewSync,
    ShrewAnimationViewSync,
    HoleViewSync,
    SceneViewSync,
  ],
  setup: ({ world, root, singletons, viewRegistry, forceFullSyncEntities }) => {
    const sceneLayer = new SceneLayer();
    sceneLayer.create(root);
    viewRegistry.registerSceneLayer(singletons.scene, sceneLayer);
    forceFullSyncEntities.push(singletons.scene);

    const holes = createHoleEntities(world, MapType.Meadow);
    for (let i = 0; i < HOLE_COUNT; i++) {
      const holeEid = holes[i];
      const shrewType = randomShrewType();
      const shrewEid = createShrewEntity(world, shrewType, MapType.Meadow);
      HoleComponent.shrewEid[holeEid] = shrewEid;

      const holeNode = new HoleNode();
      holeNode.create(root);
      holeNode.setPosition(HoleComponent.posXRatio[holeEid], HoleComponent.posYRatio[holeEid]);
      holeNode.setZOrder(HoleComponent.zIndex[holeEid]);
      viewRegistry.registerHoleNode(holeEid, holeNode);

      const shrewNode = new ShrewNode();
      shrewNode.create(holeNode.getContainer() || root);
      shrewNode.setSpriteFrame(shrewType, MapType.Meadow);
      viewRegistry.registerShrewNode(shrewEid, shrewNode);

      forceFullSyncEntities.push(holeEid, shrewEid);
    }
  },
};

function randomShrewType(): ShrewType {
  const types = [ShrewType.Red, ShrewType.Blue, ShrewType.Yellow, ShrewType.Green];
  return types[Math.floor(Math.random() * types.length)];
}
