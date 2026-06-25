import { createWorld, addEntity, addComponent } from "bitecs";
import { ShrewType, MapType, HammerType, HOLE_COUNT } from "./types";
import {
  ShrewComponent,
  HoleComponent,
  HammerComponent,
  SceneComponent,
  PlayerComponent,
  AnimationComponent,
  DirtyComponent,
  NetworkComponent,
  PerfHeroComponent,
} from "./components";
import { HolePositions, getHoleGrid, getHoleZOrder } from "../config/HolePositions";
import { DESIGN_RESOLUTION } from "../config/GameTuning";
import { PERF_HERO_RESOURCES, PERF_HERO_VIEW_LAYOUT } from "../config/ViewLayoutConfig";
import { SCENE_CYCLE_INTERVAL } from "../config/SceneConfig";
import { resetShrewForNextCycle } from "./gameplay/core/ShrewLifecycle";

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

  ShrewComponent.shrewType[entity] = shrewType;
  ShrewComponent.mapType[entity] = mapType;
  ShrewComponent.propType[entity] = 0;
  resetShrewForNextCycle(entity);

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
    HoleComponent.zIndex[entity] = getHoleZOrder(row);

    DirtyComponent.holeDirty[entity] = 0;
    DirtyComponent.forceFullSync[entity] = 0;

    holes.push(entity);
  }
  return holes;
}

/** 创建调试压测英雄 Spine 实体 */
export function createPerfHeroEntities(world: ReturnType<typeof createWorld>, count: number): number[] {
  const safeCount = Math.max(0, Math.floor(count));
  const entities: number[] = [];

  for (let i = 0; i < safeCount; i++) {
    const entity = addEntity(world);
    addComponent(world, PerfHeroComponent, entity);
    addComponent(world, DirtyComponent, entity);

    PerfHeroComponent.edge[entity] = i % 4;
    PerfHeroComponent.spawnSeq[entity] = 0;
    respawnPerfHero(entity);
    staggerInitialPerfHeroRespawn(entity);
    DirtyComponent.perfHeroDirty[entity] = 0;
    DirtyComponent.forceFullSync[entity] = 0;

    entities.push(entity);
  }

  return entities;
}

export function respawnPerfHero(eid: number): void {
  const edge = PerfHeroComponent.edge[eid];
  const pos = randomEdgePosition(edge);
  PerfHeroComponent.heroType[eid] = Math.floor(Math.random() * PERF_HERO_RESOURCES.length);
  PerfHeroComponent.posX[eid] = pos.x;
  PerfHeroComponent.posY[eid] = pos.y;
  PerfHeroComponent.scale[eid] = randomRange(PERF_HERO_VIEW_LAYOUT.minScale, PERF_HERO_VIEW_LAYOUT.maxScale);
  PerfHeroComponent.ageSec[eid] = 0;
  PerfHeroComponent.durationSec[eid] = randomRange(PERF_HERO_VIEW_LAYOUT.minDurationSec, PERF_HERO_VIEW_LAYOUT.maxDurationSec);
  PerfHeroComponent.spawnSeq[eid] += 1;
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
  const scene = addEntity(world);
  addComponent(world, SceneComponent, scene);
  addComponent(world, DirtyComponent, scene);
  SceneComponent.currentMap[scene] = MapType.Meadow;
  SceneComponent.sceneTimer[scene] = 0;
  SceneComponent.cycleInterval[scene] = SCENE_CYCLE_INTERVAL;
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

  return { hammer, scene, player, network };
}

function randomEdgePosition(edge: number): { x: number; y: number } {
  const layout = PERF_HERO_VIEW_LAYOUT;
  const minX = layout.marginX;
  const maxX = DESIGN_RESOLUTION.width - layout.marginX;
  const minY = layout.marginY;
  const maxY = DESIGN_RESOLUTION.height - layout.marginY;
  const band = layout.edgeBandSize;

  switch (edge) {
    case 0:
      return { x: randomRange(minX, maxX), y: randomRange(minY, Math.min(minY + band, maxY)) };
    case 1:
      return { x: randomRange(Math.max(minX, maxX - band), maxX), y: randomRange(minY, maxY) };
    case 2:
      return { x: randomRange(minX, maxX), y: randomRange(Math.max(minY, maxY - band), maxY) };
    default:
      return { x: randomRange(minX, Math.min(minX + band, maxX)), y: randomRange(minY, maxY) };
  }
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function staggerInitialPerfHeroRespawn(eid: number): void {
  PerfHeroComponent.ageSec[eid] = -randomRange(0, PerfHeroComponent.durationSec[eid]);
}
