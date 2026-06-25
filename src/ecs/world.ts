import { createWorld, addEntity, addComponent } from "bitecs";
import { MapType, HammerType } from "./types";
import {
  HammerComponent,
  SceneComponent,
  PlayerComponent,
  DirtyComponent,
  NetworkComponent,
} from "./components";
import { SCENE_CYCLE_INTERVAL } from "../config/SceneConfig";

/** 创建基础 ECS 世界 */
export function createGameWorld() {
  return createWorld();
}

/** 单例实体集合 */
export interface SingletonEntities {
  hammer: number;
  scene: number;
  player: number;
  network: number;
}

/** 创建单例实体 */
export function createSingletonEntities(
  world: ReturnType<typeof createWorld>,
  existing: Partial<SingletonEntities> = {},
): SingletonEntities {
  // Hammer
  const hammer = existing.hammer ?? addEntity(world);
  if (existing.hammer === undefined) {
    addComponent(world, HammerComponent, hammer);
    addComponent(world, DirtyComponent, hammer);
    HammerComponent.selectedType[hammer] = HammerType.Wood;
    HammerComponent.isThunderActive[hammer] = 0;
    HammerComponent.hitTable[hammer] = 1;
    HammerComponent.hitCooldownSec[hammer] = 0;
    HammerComponent.touchX[hammer] = 0;
    HammerComponent.touchY[hammer] = 0;
    HammerComponent.hitSeq[hammer] = 0;
    DirtyComponent.hammerDirty[hammer] = 0;
    DirtyComponent.forceFullSync[hammer] = 0;
  }

  // Scene
  const scene = existing.scene ?? addEntity(world);
  if (existing.scene === undefined) {
    addComponent(world, SceneComponent, scene);
    addComponent(world, DirtyComponent, scene);
    SceneComponent.currentMap[scene] = MapType.Meadow;
    SceneComponent.sceneTimer[scene] = 0;
    SceneComponent.cycleInterval[scene] = SCENE_CYCLE_INTERVAL;
    SceneComponent.transitioning[scene] = 0;
    DirtyComponent.sceneDirty[scene] = 0;
    DirtyComponent.forceFullSync[scene] = 0;
  }

  // Player
  const player = addEntity(world);
  addComponent(world, PlayerComponent, player);
  addComponent(world, DirtyComponent, player);
  PlayerComponent.money[player] = 0;
  PlayerComponent.angry[player] = 0;
  PlayerComponent.power[player] = 0;
  PlayerComponent.powerTop[player] = 0;
  PlayerComponent.level[player] = 0;
  DirtyComponent.playerDirty[player] = 0;
  DirtyComponent.forceFullSync[player] = 0;

  // Network
  const network = addEntity(world);
  addComponent(world, NetworkComponent, network);
  NetworkComponent.connected[network] = 0;
  NetworkComponent.pendingKick[network] = 0;

  return { hammer, scene, player, network };
}
