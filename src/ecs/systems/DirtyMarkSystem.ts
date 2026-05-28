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
type DirtyTarget =
  | "shrewDirty"
  | "animDirty"
  | "holeDirty"
  | "hammerDirty"
  | "comboDirty"
  | "sceneDirty"
  | "playerDirty"
  | "hitDirty";

type DirtyStoreKey = keyof DirtySnapshotStore;
type FieldReader = { name: string; read: (eid: number) => number };
type DirtyGroup = { bit: number; fields: FieldReader[] };

interface DirtySchema {
  query: (world: any) => ArrayLike<number>;
  storeKey: DirtyStoreKey;
  dirtyTarget: DirtyTarget;
  allBits: number;
  groups: DirtyGroup[];
}

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
      if (cur[field.name] !== prev[field.name]) {
        dirty |= group.bit;
        break;
      }
    }
  }
  return dirty;
}

function buildSnapshot(eid: number, groups: DirtyGroup[]): Snapshot {
  const snapshot: Snapshot = {};
  for (const group of groups) {
    for (const field of group.fields) {
      snapshot[field.name] = field.read(eid);
    }
  }
  return snapshot;
}

function markSchemaDirty(world: any, store: DirtySnapshotStore, schema: DirtySchema): void {
  const entities = schema.query(world);
  const snapshotStore = store[schema.storeKey];
  const dirtyArray = (DirtyComponent as any)[schema.dirtyTarget];

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const cur = buildSnapshot(eid, schema.groups);
    dirtyArray[eid] = dirtyBitsFromSnapshot(
      snapshotStore.get(eid),
      cur,
      schema.groups,
      schema.allBits,
    );
    snapshotStore.set(eid, cur);
  }
}

const DIRTY_SCHEMAS: DirtySchema[] = [
  {
    query: shrewQuery,
    storeKey: "shrew",
    dirtyTarget: "shrewDirty",
    allBits: BIT_SHREW_ALL,
    groups: [
      { bit: BIT_SHREW_TYPE, fields: [{ name: "shrewType", read: eid => ShrewComponent.shrewType[eid] }] },
      { bit: BIT_SHREW_HP, fields: [{ name: "hp", read: eid => ShrewComponent.hp[eid] }] },
      { bit: BIT_SHREW_ACTION, fields: [{ name: "actionState", read: eid => ShrewComponent.actionState[eid] }] },
      { bit: BIT_SHREW_HAT, fields: [{ name: "hasHat", read: eid => ShrewComponent.hasHat[eid] }] },
      { bit: BIT_SHREW_MAP, fields: [{ name: "mapType", read: eid => ShrewComponent.mapType[eid] }] },
      { bit: BIT_SHREW_CLICKABLE, fields: [{ name: "isClickable", read: eid => ShrewComponent.isClickable[eid] }] },
      { bit: BIT_SHREW_TIMER, fields: [{ name: "animTimer", read: eid => ShrewComponent.animTimer[eid] }] },
      { bit: BIT_SHREW_PROP, fields: [{ name: "propType", read: eid => ShrewComponent.propType[eid] }] },
    ],
  },
  {
    query: shrewQuery,
    storeKey: "anim",
    dirtyTarget: "animDirty",
    allBits: BIT_ANIM_ALL,
    groups: [
      { bit: BIT_ANIM_TYPE, fields: [{ name: "animType", read: eid => AnimationComponent.animType[eid] }] },
      { bit: BIT_ANIM_PROGRESS, fields: [{ name: "progress", read: eid => AnimationComponent.progress[eid] }] },
      { bit: BIT_ANIM_DURATION, fields: [{ name: "duration", read: eid => AnimationComponent.duration[eid] }] },
    ],
  },
  {
    query: holeQuery,
    storeKey: "hole",
    dirtyTarget: "holeDirty",
    allBits: BIT_HOLE_ALL,
    groups: [
      {
        bit: BIT_HOLE_POS,
        fields: [
          { name: "posXRatio", read: eid => HoleComponent.posXRatio[eid] },
          { name: "posYRatio", read: eid => HoleComponent.posYRatio[eid] },
        ],
      },
      { bit: BIT_HOLE_SHREW, fields: [{ name: "shrewEid", read: eid => HoleComponent.shrewEid[eid] }] },
      { bit: BIT_HOLE_ZORDER, fields: [{ name: "zIndex", read: eid => HoleComponent.zIndex[eid] }] },
    ],
  },
  {
    query: hammerQuery,
    storeKey: "hammer",
    dirtyTarget: "hammerDirty",
    allBits: BIT_HAMMER_ALL,
    groups: [
      { bit: BIT_HAMMER_TYPE, fields: [{ name: "selectedType", read: eid => HammerComponent.selectedType[eid] }] },
      { bit: BIT_HAMMER_THUNDER, fields: [{ name: "isThunderActive", read: eid => HammerComponent.isThunderActive[eid] }] },
      { bit: BIT_HAMMER_HITTABLE, fields: [{ name: "hitTable", read: eid => HammerComponent.hitTable[eid] }] },
    ],
  },
  {
    query: comboQuery,
    storeKey: "combo",
    dirtyTarget: "comboDirty",
    allBits: BIT_COMBO_ALL,
    groups: [
      { bit: BIT_COMBO_COUNT, fields: [{ name: "comboCount", read: eid => ComboComponent.comboCount[eid] }] },
      { bit: BIT_COMBO_ID, fields: [{ name: "comboID", read: eid => ComboComponent.comboID[eid] }] },
      {
        bit: BIT_COMBO_TARGETS,
        fields: [
          { name: "targetHole0", read: eid => ComboComponent.targetHole0[eid] },
          { name: "targetHole1", read: eid => ComboComponent.targetHole1[eid] },
          { name: "targetHole2", read: eid => ComboComponent.targetHole2[eid] },
        ],
      },
    ],
  },
  {
    query: sceneQuery,
    storeKey: "scene",
    dirtyTarget: "sceneDirty",
    allBits: BIT_SCENE_ALL,
    groups: [
      { bit: BIT_SCENE_MAP, fields: [{ name: "currentMap", read: eid => SceneComponent.currentMap[eid] }] },
      { bit: BIT_SCENE_TIMER, fields: [{ name: "sceneTimer", read: eid => SceneComponent.sceneTimer[eid] }] },
      { bit: BIT_SCENE_TRANSITION, fields: [{ name: "transitioning", read: eid => SceneComponent.transitioning[eid] }] },
    ],
  },
  {
    query: playerQuery,
    storeKey: "player",
    dirtyTarget: "playerDirty",
    allBits: BIT_PLAYER_ALL,
    groups: [
      { bit: BIT_PLAYER_MONEY, fields: [{ name: "money", read: eid => PlayerComponent.money[eid] }] },
      { bit: BIT_PLAYER_ANGRY, fields: [{ name: "angry", read: eid => PlayerComponent.angry[eid] }] },
      {
        bit: BIT_PLAYER_POWER,
        fields: [
          { name: "power", read: eid => PlayerComponent.power[eid] },
          { name: "powerTop", read: eid => PlayerComponent.powerTop[eid] },
        ],
      },
      { bit: BIT_PLAYER_LEVEL, fields: [{ name: "level", read: eid => PlayerComponent.level[eid] }] },
    ],
  },
  {
    query: hitQuery,
    storeKey: "hit",
    dirtyTarget: "hitDirty",
    allBits: BIT_HIT_ALL,
    groups: [
      { bit: BIT_HIT_INDEX, fields: [{ name: "shrewIndex", read: eid => HitComponent.shrewIndex[eid] }] },
      { bit: BIT_HIT_REWARD, fields: [{ name: "reward", read: eid => HitComponent.reward[eid] }] },
      { bit: BIT_HIT_WASHIT, fields: [{ name: "wasHit", read: eid => HitComponent.wasHit[eid] }] },
    ],
  },
];

/**
 * 脏标记系统: 比较前后帧差异，设置 dirty bits
 */
export function dirtyMarkSystem(world: any): void {
  const store = getStore(world);
  for (const schema of DIRTY_SCHEMAS) {
    markSchemaDirty(world, store, schema);
  }
}
