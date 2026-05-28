/**
 * DirtyMarkSystem — 脏标记系统
 *
 * 职责: 比较当前帧与上一帧的组件数据差异，设置 DirtyComponent 的 bitmask。
 * SyncView 读取这些 bitmask 来决定哪些 Laya 节点属性需要更新。
 *
 * bit 定义集中在 binding/DirtyFlags.ts，DirtyMarkSystem 和 Binding 共用同一份常量，
 * 避免 ECS 已标脏但 Binding 读错 bit 的同步遗漏。
 */
import { defineQuery } from "bitecs";
import {
  ShrewComponent,
  AnimationComponent,
  DirtyComponent,
  HoleComponent,
  HammerComponent,
  ComboComponent,
  SceneComponent,
  PlayerComponent,
  HitComponent,
} from "../components";
import {
  BIT_SHREW_TYPE,
  BIT_SHREW_HP,
  BIT_SHREW_ACTION,
  BIT_SHREW_HAT,
  BIT_SHREW_MAP,
  BIT_SHREW_CLICKABLE,
  BIT_SHREW_TIMER,
  BIT_SHREW_PROP,
  BIT_SHREW_ALL,
  BIT_HOLE_POS,
  BIT_HOLE_SHREW,
  BIT_HOLE_ZORDER,
  BIT_HOLE_ALL,
  BIT_HAMMER_TYPE,
  BIT_HAMMER_THUNDER,
  BIT_HAMMER_HITTABLE,
  BIT_HAMMER_ALL,
  BIT_COMBO_COUNT,
  BIT_COMBO_ID,
  BIT_COMBO_TARGETS,
  BIT_COMBO_ALL,
  BIT_SCENE_MAP,
  BIT_SCENE_TIMER,
  BIT_SCENE_TRANSITION,
  BIT_SCENE_ALL,
  BIT_PLAYER_MONEY,
  BIT_PLAYER_ANGRY,
  BIT_PLAYER_POWER,
  BIT_PLAYER_LEVEL,
  BIT_PLAYER_ALL,
  BIT_ANIM_TYPE,
  BIT_ANIM_PROGRESS,
  BIT_ANIM_DURATION,
  BIT_ANIM_ALL,
  BIT_HIT_INDEX,
  BIT_HIT_REWARD,
  BIT_HIT_WASHIT,
  BIT_HIT_ALL,
} from "../../binding/DirtyFlags";

const shrewQuery = defineQuery([ShrewComponent, AnimationComponent, DirtyComponent]);
const holeQuery = defineQuery([HoleComponent, DirtyComponent]);
const hammerQuery = defineQuery([HammerComponent, DirtyComponent]);
const comboQuery = defineQuery([ComboComponent, DirtyComponent]);
const sceneQuery = defineQuery([SceneComponent, DirtyComponent]);
const playerQuery = defineQuery([PlayerComponent, DirtyComponent]);
const hitQuery = defineQuery([HitComponent, DirtyComponent]);

type Snapshot = Record<string, number>;
type DirtyGroup = { bit: number; fields: string[] };

interface DirtySnapshotStore {
  shrew: Map<number, Snapshot>;
  anim: Map<number, Snapshot>;
  hole: Map<number, Snapshot>;
  hammer: Map<number, Snapshot>;
  combo: Map<number, Snapshot>;
  scene: Map<number, Snapshot>;
  player: Map<number, Snapshot>;
  hit: Map<number, Snapshot>;
}

const stores = new WeakMap<object, DirtySnapshotStore>();

function getStore(world: object): DirtySnapshotStore {
  let store = stores.get(world);
  if (!store) {
    store = {
      shrew: new Map(),
      anim: new Map(),
      hole: new Map(),
      hammer: new Map(),
      combo: new Map(),
      scene: new Map(),
      player: new Map(),
      hit: new Map(),
    };
    stores.set(world, store);
  }
  return store;
}

function dirtyBitsFromSnapshot(
  prev: Snapshot | undefined,
  cur: Snapshot,
  groups: DirtyGroup[],
  allBits: number,
): number {
  if (!prev) return allBits;

  let dirty = 0;
  for (const group of groups) {
    for (const field of group.fields) {
      if (cur[field] !== prev[field]) {
        dirty |= group.bit;
        break;
      }
    }
  }
  return dirty;
}

/**
 * 脏标记系统: 比较前后帧差异，设置 dirty bits
 */
export function dirtyMarkSystem(world: any): void {
  const store = getStore(world);
  markShrewAndAnimationDirty(world, store);
  markHoleDirty(world, store);
  markHammerDirty(world, store);
  markComboDirty(world, store);
  markSceneDirty(world, store);
  markPlayerDirty(world, store);
  markHitDirty(world, store);
}

function markShrewAndAnimationDirty(world: any, store: DirtySnapshotStore): void {
  const entities = shrewQuery(world);

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];

    const curShrew = {
      shrewType: ShrewComponent.shrewType[eid],
      hp: ShrewComponent.hp[eid],
      actionState: ShrewComponent.actionState[eid],
      hasHat: ShrewComponent.hasHat[eid],
      mapType: ShrewComponent.mapType[eid],
      isClickable: ShrewComponent.isClickable[eid],
      animTimer: ShrewComponent.animTimer[eid],
      propType: ShrewComponent.propType[eid],
    };
    const curAnim = {
      animType: AnimationComponent.animType[eid],
      progress: AnimationComponent.progress[eid],
      duration: AnimationComponent.duration[eid],
    };

    DirtyComponent.shrewDirty[eid] = dirtyBitsFromSnapshot(store.shrew.get(eid), curShrew, [
      { bit: BIT_SHREW_TYPE, fields: ["shrewType"] },
      { bit: BIT_SHREW_HP, fields: ["hp"] },
      { bit: BIT_SHREW_ACTION, fields: ["actionState"] },
      { bit: BIT_SHREW_HAT, fields: ["hasHat"] },
      { bit: BIT_SHREW_MAP, fields: ["mapType"] },
      { bit: BIT_SHREW_CLICKABLE, fields: ["isClickable"] },
      { bit: BIT_SHREW_TIMER, fields: ["animTimer"] },
      { bit: BIT_SHREW_PROP, fields: ["propType"] },
    ], BIT_SHREW_ALL);

    DirtyComponent.animDirty[eid] = dirtyBitsFromSnapshot(store.anim.get(eid), curAnim, [
      { bit: BIT_ANIM_TYPE, fields: ["animType"] },
      { bit: BIT_ANIM_PROGRESS, fields: ["progress"] },
      { bit: BIT_ANIM_DURATION, fields: ["duration"] },
    ], BIT_ANIM_ALL);

    store.shrew.set(eid, curShrew);
    store.anim.set(eid, curAnim);
  }
}

function markHoleDirty(world: any, store: DirtySnapshotStore): void {
  const entities = holeQuery(world);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const cur = {
      posXRatio: HoleComponent.posXRatio[eid],
      posYRatio: HoleComponent.posYRatio[eid],
      shrewEid: HoleComponent.shrewEid[eid],
      zIndex: HoleComponent.zIndex[eid],
    };
    DirtyComponent.holeDirty[eid] = dirtyBitsFromSnapshot(store.hole.get(eid), cur, [
      { bit: BIT_HOLE_POS, fields: ["posXRatio", "posYRatio"] },
      { bit: BIT_HOLE_SHREW, fields: ["shrewEid"] },
      { bit: BIT_HOLE_ZORDER, fields: ["zIndex"] },
    ], BIT_HOLE_ALL);
    store.hole.set(eid, cur);
  }
}

function markHammerDirty(world: any, store: DirtySnapshotStore): void {
  const entities = hammerQuery(world);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const cur = {
      selectedType: HammerComponent.selectedType[eid],
      isThunderActive: HammerComponent.isThunderActive[eid],
      hitTable: HammerComponent.hitTable[eid],
    };
    DirtyComponent.hammerDirty[eid] = dirtyBitsFromSnapshot(store.hammer.get(eid), cur, [
      { bit: BIT_HAMMER_TYPE, fields: ["selectedType"] },
      { bit: BIT_HAMMER_THUNDER, fields: ["isThunderActive"] },
      { bit: BIT_HAMMER_HITTABLE, fields: ["hitTable"] },
    ], BIT_HAMMER_ALL);
    store.hammer.set(eid, cur);
  }
}

function markComboDirty(world: any, store: DirtySnapshotStore): void {
  const entities = comboQuery(world);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const cur = {
      comboCount: ComboComponent.comboCount[eid],
      comboID: ComboComponent.comboID[eid],
      targetHole0: ComboComponent.targetHole0[eid],
      targetHole1: ComboComponent.targetHole1[eid],
      targetHole2: ComboComponent.targetHole2[eid],
    };
    DirtyComponent.comboDirty[eid] = dirtyBitsFromSnapshot(store.combo.get(eid), cur, [
      { bit: BIT_COMBO_COUNT, fields: ["comboCount"] },
      { bit: BIT_COMBO_ID, fields: ["comboID"] },
      { bit: BIT_COMBO_TARGETS, fields: ["targetHole0", "targetHole1", "targetHole2"] },
    ], BIT_COMBO_ALL);
    store.combo.set(eid, cur);
  }
}

function markSceneDirty(world: any, store: DirtySnapshotStore): void {
  const entities = sceneQuery(world);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const cur = {
      currentMap: SceneComponent.currentMap[eid],
      sceneTimer: SceneComponent.sceneTimer[eid],
      transitioning: SceneComponent.transitioning[eid],
    };
    DirtyComponent.sceneDirty[eid] = dirtyBitsFromSnapshot(store.scene.get(eid), cur, [
      { bit: BIT_SCENE_MAP, fields: ["currentMap"] },
      { bit: BIT_SCENE_TIMER, fields: ["sceneTimer"] },
      { bit: BIT_SCENE_TRANSITION, fields: ["transitioning"] },
    ], BIT_SCENE_ALL);
    store.scene.set(eid, cur);
  }
}

function markPlayerDirty(world: any, store: DirtySnapshotStore): void {
  const entities = playerQuery(world);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const cur = {
      money: PlayerComponent.money[eid],
      angry: PlayerComponent.angry[eid],
      power: PlayerComponent.power[eid],
      powerTop: PlayerComponent.powerTop[eid],
      level: PlayerComponent.level[eid],
    };
    DirtyComponent.playerDirty[eid] = dirtyBitsFromSnapshot(store.player.get(eid), cur, [
      { bit: BIT_PLAYER_MONEY, fields: ["money"] },
      { bit: BIT_PLAYER_ANGRY, fields: ["angry"] },
      { bit: BIT_PLAYER_POWER, fields: ["power", "powerTop"] },
      { bit: BIT_PLAYER_LEVEL, fields: ["level"] },
    ], BIT_PLAYER_ALL);
    store.player.set(eid, cur);
  }
}

function markHitDirty(world: any, store: DirtySnapshotStore): void {
  const entities = hitQuery(world);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const cur = {
      shrewIndex: HitComponent.shrewIndex[eid],
      reward: HitComponent.reward[eid],
      wasHit: HitComponent.wasHit[eid],
    };
    DirtyComponent.hitDirty[eid] = dirtyBitsFromSnapshot(store.hit.get(eid), cur, [
      { bit: BIT_HIT_INDEX, fields: ["shrewIndex"] },
      { bit: BIT_HIT_REWARD, fields: ["reward"] },
      { bit: BIT_HIT_WASHIT, fields: ["wasHit"] },
    ], BIT_HIT_ALL);
    store.hit.set(eid, cur);
  }
}
