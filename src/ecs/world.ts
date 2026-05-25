import { createWorld, addEntity, addComponent } from "bitecs";
import { ShrewType, ShrewAction, MapType, HammerType, HOLE_COUNT } from "./types";
import {
  ShrewComponent,
  HoleComponent,
  HammerComponent,
  ComboComponent,
  SceneComponent,
  PlayerComponent,
  AnimationComponent,
  DirtyComponent,
  NetworkComponent,
} from "./components";
import { HolePositions, getHoleGrid, getHoleZOrder } from "../config/HolePositions";

/** 创建基础 ECS 世界 */
export function createGameWorld() {
  return createWorld();
}

/** 创建地鼠实体 */
export function createShrewEntity(world: ReturnType<typeof createWorld>, shrewType: ShrewType, mapType: MapType): number {
  const entity = addEntity(world);
  addComponent(world, ShrewComponent, entity);
  addComponent(world, AnimationComponent, entity);
  addComponent(world, DirtyComponent, entity);

  // 根据 type 设置初始值
  const hp = shrewType === ShrewType.Blue ? 2 : 1;
  const hasHat = shrewType === ShrewType.Blue ? 1 : 0;

  ShrewComponent.shrewType[entity] = shrewType;
  ShrewComponent.hp[entity] = hp;
  ShrewComponent.actionState[entity] = ShrewAction.None;
  ShrewComponent.hasHat[entity] = hasHat;
  ShrewComponent.mapType[entity] = mapType;
  ShrewComponent.isClickable[entity] = 0;
  ShrewComponent.animTimer[entity] = 0;
  ShrewComponent.propType[entity] = 0;

  AnimationComponent.animType[entity] = 0;
  AnimationComponent.progress[entity] = 0;
  AnimationComponent.duration[entity] = 0;

  DirtyComponent.shrewDirty[entity] = 0;
  DirtyComponent.animDirty[entity] = 0;
  DirtyComponent.forceFullSync[entity] = 0;

  return entity;
}

/** 创建9个洞位实体 */
export function createHoleEntities(world: ReturnType<typeof createWorld>, mapType: MapType): number[] {
  const positions = HolePositions[mapType];
  if (!positions) throw new Error(`No hole positions for map type ${mapType}`);

  const holes: number[] = [];
  for (let i = 0; i < HOLE_COUNT; i++) {
    const entity = addEntity(world);
    addComponent(world, HoleComponent, entity);
    addComponent(world, DirtyComponent, entity);

    const { row, col } = getHoleGrid(i);
    HoleComponent.gridRow[entity] = row;
    HoleComponent.gridCol[entity] = col;
    HoleComponent.posXRatio[entity] = positions.xRatios[i];
    HoleComponent.posYRatio[entity] = positions.yRatios[i];
    HoleComponent.shrewEid[entity] = 0;
    HoleComponent.zIndex[entity] = getHoleZOrder(row, mapType);

    DirtyComponent.holeDirty[entity] = 0;
    DirtyComponent.forceFullSync[entity] = 0;

    holes.push(entity);
  }
  return holes;
}

/** 单例实体集合 */
export interface SingletonEntities {
  hammer: number;
  combo: number;
  scene: number;
  player: number;
  network: number;
}

/** 创建单例实体 */
export function createSingletonEntities(world: ReturnType<typeof createWorld>): SingletonEntities {
  // Hammer
  const hammer = addEntity(world);
  addComponent(world, HammerComponent, hammer);
  addComponent(world, DirtyComponent, hammer);
  HammerComponent.selectedType[hammer] = HammerType.Wood;
  HammerComponent.isThunderActive[hammer] = 0;
  HammerComponent.hitTable[hammer] = 1;
  DirtyComponent.hammerDirty[hammer] = 0;
  DirtyComponent.forceFullSync[hammer] = 0;

  // Combo
  const combo = addEntity(world);
  addComponent(world, ComboComponent, combo);
  addComponent(world, DirtyComponent, combo);
  ComboComponent.comboCount[combo] = 0;
  ComboComponent.comboID[combo] = 0;
  ComboComponent.targetHole0[combo] = 0;
  ComboComponent.targetHole1[combo] = 0;
  ComboComponent.targetHole2[combo] = 0;
  DirtyComponent.comboDirty[combo] = 0;
  DirtyComponent.forceFullSync[combo] = 0;

  // Scene
  const scene = addEntity(world);
  addComponent(world, SceneComponent, scene);
  addComponent(world, DirtyComponent, scene);
  SceneComponent.currentMap[scene] = MapType.Meadow;
  SceneComponent.sceneTimer[scene] = 0;
  SceneComponent.cycleInterval[scene] = 100;
  SceneComponent.transitioning[scene] = 0;
  DirtyComponent.sceneDirty[scene] = 0;
  DirtyComponent.forceFullSync[scene] = 0;

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

  return { hammer, combo, scene, player, network };
}
